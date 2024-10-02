import { ModelType } from "../_imports/model";
import {
  SessionUserAttributes,
  sessionUserAttributes,
  SessionUserModelOptions,
} from "../_imports/sessionUser";
import type { ApiResponse } from "../util/api";
import * as api from "../util/api";
import { getDefaultsFromDefinition } from "../util/attributes";
import type GuideDialog from "../view/dialog/guide";
import { TextNotificationTheme } from "../view/notification/_imports/text";
import type TextNotification from "../view/notification/text";
import type ApplicationCore from "./app";
import type TeamCollection from "./collection/teams";
import type TeamModel from "./team";
import UserModel from "./user";

export default class SessionUser extends UserModel<SessionUserAttributes> {
  static type = ModelType.SessionUser;

  declare options: SessionUserModelOptions;

  private teamsCollection: TeamCollection | undefined | null = null;
  private activeTeam: TeamModel | null = null;

  constructor(options: SessionUserModelOptions, app: ApplicationCore) {
    super(
      {
        ...options,
        customEvents: ["login", "logout"],
        attributeDefinition: sessionUserAttributes,
      },
      app
    );

    this.isReady = new Promise(async (resolve) => {
      await Promise.all([
        this.isReady,
        new Promise((resolve) => this.loadTeams().then(resolve)),
      ]);
      resolve(this);
    });
  }

  isLoggedIn(): boolean {
    return this.getId() > 0;
  }

  async login(email?: string, password?: string): Promise<boolean> {
    if (!email || !password) {
      return this.throwError(
        "Problem logging in",
        "Login requires an email and password."
      );
    }

    if (this.isLoggedIn()) {
      return this.throwError(
        "Problem logging in",
        "Cannot log in while already logged in."
      );
    }

    try {
      const response = await api.loginUser(email, password);

      if (!response.ok) {
        return this.throwError(
          "Problem logging in",
          response.errors?.join(", ") || "Failed to log in."
        );
      }

      this.set(response.data);
      await this.loadTeams();
      this.emit("login");
      this.app.navigate("/");
    } catch (error) {
      return this.throwError("Problem logging in", error);
    }

    this.app.notificationController.closeAll();

    // TODO: Should we defer if the user has already seen this dialog and dismissed but has not added property yet?
    setTimeout(() => this.promptForWelcomeDialog(), 1000);

    return true;
  }

  async createAccount({
    email,
    password,
    teamId,
  }: {
    email: string;
    password: string;
    teamId?: number;
  }): Promise<boolean> {
    if (this.isLoggedIn()) {
      return this.throwError(
        "Problem creating account",
        "Cannot create a new account while logged in."
      );
    }

    if (!email || !password) {
      return this.throwError(
        "Problem creating account",
        "Account creation requires an email and password."
      );
    }

    try {
      const response = await api.createAccount(email, password, teamId);

      if (!response.ok) {
        return this.throwError(
          "Problem creating account",
          response.errors?.join(", ") || "Failed to create account."
        );
      }

      this.set(
        getDefaultsFromDefinition<SessionUserAttributes>(
          this.attributeDefinition,
          response.data
        )
      );
      await this.save(); // Push our default values into the newly created user record
      await this.loadTeams();
      this.emit("login");
      this.app.navigate("/");
    } catch (error) {
      return this.throwError("Problem creating account", error);
    }

    this.app.notificationController.closeAll();
    setTimeout(() => this.promptForWelcomeDialog(), 1000);

    return true;
  }

  promptForWelcomeDialog() {
    // If user has no properties, display the "Welcome" guide dialog
    // TODO: Make our navigation actions use promises, and display this dialog after successfully navigating to root
    const propertyIds = this.getActiveTeam()?.get("property_ids");

    if (!propertyIds || !propertyIds.length) {
      this.app.dialogController.load<GuideDialog>("guide", {
        title: "Welcome to RentalGuru!",
        image: {
          src: "/img/guru_welcome.jpg",
          alt: "Welcome to RentalGuru!",
          width: 610,
          height: 280,
        },
        text: "Glad to see you here! Let's get started by adding your first property.",
        primaryLabel: "Add Your First Property",
        onPrimary: () => this.app.navigate("/properties/new/"),
        secondaryLabel: "Import Properties",
        onSecondary: () => this.app.navigate("/properties/import/"),
      });
    }
  }

  async logout(): Promise<void> {
    if (!this.isLoggedIn()) return;

    await api.logoutUser();

    this.reset();
    this.emit("logout");
  }

  async save(): Promise<ApiResponse | undefined> {
    if (!this.isLoggedIn()) {
      this.throwError(
        "Problem saving data",
        "Cannot save session user data while logged out."
      );
      return Promise.resolve(undefined);
    }

    try {
      const payload = this.getAttributes();
      const response = await api.updateAccountDetails(payload);

      if (response.ok) {
        const savedData = response.data;
        this.set(savedData);
        this.debouncedEmit<Record<string, any>>("save:success", savedData);
      } else {
        this.throwError(
          "Problem saving data",
          response.errors?.join(", ") || "Failed to save session user data."
        );
        this.debouncedEmit<Record<string, any>>("save:fail");
      }
      return response;
    } catch (error) {
      this.throwError("Problem saving data", error);
      this.debouncedEmit<Record<string, any>>("save:fail");
      return undefined;
    }
  }

  async fetch(): Promise<ApiResponse | undefined> {
    if (!this.isLoggedIn()) {
      this.throwError(
        "Problem fetching data",
        "Cannot fetch session user data while logged out."
      );
      return Promise.resolve(undefined);
    }

    try {
      const response = await api.fetchAccountDetails();

      if (response.ok) {
        const fetchedData = response.data;
        this.set(fetchedData);
        this.debouncedEmit<Record<string, any>>("fetch:success", fetchedData);
      } else {
        this.throwError(
          "Problem fetching data",
          response.errors?.join(", ") || "Failed to fetch session user data."
        );
        this.debouncedEmit<Record<string, any>>("fetch:fail");
      }

      return response;
    } catch (error) {
      this.throwError("Problem fetching data", error);
      this.debouncedEmit<Record<string, any>>("fetch:fail");
      return undefined;
    }
  }

  reset(silent = false): SessionUser {
    const resetAttributes: Partial<SessionUserAttributes> = {};

    for (const [key, definition] of Object.entries(sessionUserAttributes)) {
      if (
        definition &&
        typeof definition === "object" &&
        "default" in definition
      ) {
        resetAttributes[key as keyof SessionUserAttributes] =
          definition.default as SessionUserAttributes[keyof SessionUserAttributes];
      } else {
        resetAttributes[key as keyof SessionUserAttributes] = undefined;
      }
    }

    this.set(resetAttributes);

    this.teamsCollection?.destroy();
    this.teamsCollection = null;
    this.activeTeam?.destroy();
    this.activeTeam = null;

    if (!silent) {
      this.emit("reset");
    }

    return this;
  }

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<ApiResponse | undefined> {
    let response: ApiResponse | undefined;

    try {
      response = await api.changePassword(oldPassword, newPassword);
      if (response.ok) {
        this.app.notificationController.load<TextNotification>("text", {
          message: "Password changed successfully.",
          theme: TextNotificationTheme.Success,
        });
      } else {
        this.app.notificationController.load<TextNotification>("text", {
          message: "Failed to change password.",
          theme: TextNotificationTheme.Error,
        });
      }
    } catch (error) {
      this.app.notificationController.load<TextNotification>("text", {
        message: "Failed to change password.",
        theme: TextNotificationTheme.Error,
      });
    }

    return response;
  }

  async delete(): Promise<ApiResponse | undefined> {
    if (!this.isLoggedIn()) {
      console.warn("Cannot delete session user data while logged out.");
      return Promise.resolve(undefined);
    }

    try {
      const response = await api.deleteAccount();

      if (response.ok) {
        this.reset(); // Assuming reset method clears the session user data
        this.debouncedEmit("delete", {
          message: "Session user data deleted successfully.",
        });
      } else {
        this.throwError(
          "Problem deleting data",
          response.errors?.join(", ") || "Failed to delete session user data."
        );
        this.debouncedEmit("delete:fail");
      }

      return response;
    } catch (error) {
      this.throwError("Problem deleting data", error);
      this.debouncedEmit("delete:fail");
      return undefined;
    }
  }

  getTeams(): TeamCollection | undefined | null {
    return this.teamsCollection;
  }

  getTeamById(id: number): TeamModel | undefined {
    return this.teamsCollection?.findById(id);
  }

  getActiveTeam(): TeamModel | null {
    // TODO: Better handling of requests to this function when user is logged out

    return this.activeTeam;
  }

  async loadTeams(force = false): Promise<this> {
    if (!this.isLoggedIn()) return this;

    const teamIds = this.get("team_ids");

    if (!teamIds || !teamIds.length) {
      this.throwError(
        "Problem getting team",
        "No team IDs associated with this user."
      );
      return this;
    }

    // If we already have a collection and force is not true, refetch data for all teams.
    if (this.teamsCollection && !force) {
      await this.teamsCollection.fetchAll();
      return this;
    }

    // If force is true or collection doesn't exist, destroy any existing collection
    if (this.teamsCollection || force) {
      this.teamsCollection?.destroy();
      this.teamsCollection = null;
    }

    // Create a new teams collection with the IDs
    this.teamsCollection = await this.app.newInstance<TeamCollection>(
      "collection-teams",
      {
        ids: teamIds,
      }
    );

    // Wait for teamsCollection to be ready before returning
    await this.teamsCollection.isReady;
    await this.setActiveTeam(this.get("active_team_id") || teamIds[0]);

    return this;
  }

  async setActiveTeam(id: number): Promise<void> {
    if (!this.teamsCollection) {
      return console.warn(
        "Teams collection is not loaded. Please call loadTeams() first."
      );
    }

    // Ensure the teams collection is fully loaded
    await this.teamsCollection.isReady;

    const team = this.teamsCollection.findById(id);
    if (team) {
      if (!this.activeTeam || this.activeTeam.getId() !== id) {
        this.activeTeam = team;
      }

      return;
    } else {
      console.warn(`Team with ID ${id} not found in the collection.`);
    }
  }
}
