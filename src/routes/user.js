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
