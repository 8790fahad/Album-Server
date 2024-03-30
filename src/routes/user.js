import passport from "passport";
import config from "../config/config";
import { allowOnly } from "../services/routesHelper";
import {
  create,
  login,
  findById,
  update,
  deleteUser,
  findByUsername,
  verifyToken,
  resetPassword,
  verifyEmail,
  deActivateAccount,
  forgetPassword,
  changePassword,
  updateUserBasicInfo,
  updateUserInfo,
  updateUserSocial,
} from "../controllers/user";

module.exports = (app) => {
  // create a new user
  app.post("/api/users/create", create);
  app.get("/api/users/find-by-username/:username", findByUsername);

  // user login
  app.post("/api/users/login", login);

  //retrieve all users
  // app.get(
  //   '/api/users',
  //   passport.authenticate('jwt', {
  //     session: false
  //   }),
  //   allowOnly(config.accessLevels.admin, findAllUsers)
  // );

  // retrieve user by id
  app.get(
    "/api/users/:userId",
    passport.authenticate("jwt", {
      session: false,
    }),
    allowOnly(config.accessLevels.admin, findById)
  );

  app.get("/api/users/verify-token/:token", verifyToken);
  app.post("/api/users/reset-password", resetPassword);
  app.get("/api/users/verify-email/:token", verifyEmail);
  app.put("/api/users/change-password", changePassword);
  app.put("/api/users/de-activate-account", deActivateAccount);
  app.post("/api/users/forget-password", forgetPassword);
  app.put("/api/users/update-user-basic-info",updateUserBasicInfo)
  app.put("/api/users/update-user-info",updateUserInfo)
  app.put("/api/users/update-user-social",updateUserSocial)  
  // update a user with id
  app.put(
    "/api/users/:userId",
    passport.authenticate("jwt", {
      session: false,
    }),
    allowOnly(config.accessLevels.user, update)
  );

  // delete a user
  app.delete(
    "/api/users/:userId",
    passport.authenticate("jwt", {
      session: false,
    }),
    allowOnly(config.accessLevels.admin, deleteUser)
  );
};
