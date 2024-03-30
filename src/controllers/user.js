import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";

import db from "../models";
const User = db.User;
import validateRegisterForm from "../validation/register";
import validateLoginForm from "../validation/login";
import { Op } from "sequelize";
import moment from "moment";
import { transporter } from "..";

const mailOptions = ({
  in_from = "",
  in_to = "",
  subject = "",
  context = {},
  template_name = "",
}) => {
  return {
    from: in_from,
    to: in_to,
    subject: subject,
    template: template_name,
    context: context,
  };
};

const verifyToken = (req, res) => {
  const { token } = req.params;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.json({
        success: false,
        msg: "Failed to authenticate token.",
        err,
      });
    }
    const { username } = decoded;
    User.findAll({ where: { username } })
      .then((user) => {
        if (!user.length) {
          return res.json({ msg: "user not found" });
        }
        res.json({
          success: true,
          user: user[0],
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ err });
      });
  });
};

const resetPassword = (req, res) => {
  const { username, password, newPassword } = req.body;
  User.findOne({ where: { username } })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ msg: "User not found", success: false });
      }
      bcrypt.compare(password, user.password).then((isMatch) => {
        if (!isMatch) {
          return res
            .status(400)
            .json({ msg: "Incorrect password", success: false });
        }
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newPassword, salt, (err, hash) => {
            if (err) throw err;
            user.password = hash;
            user
              .save()
              .then(() =>
                res
                  .status(200)
                  .json({ msg: "Password reset successful", success: true })
              )
              .catch((err) => res.status(500).json({ err, success: false }));
          });
        });
      });
    })
    .catch((err) => res.status(500).json({ err }));
};

const changePassword = (req, res) => {
  const { token, password } = req.body;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.json({
        success: false,
        msg: "Failed to authenticate token.",
        err,
      });
    }
    const { username, date } = decoded;
    console.log(decoded)
    const currentDate = moment();
    const dateToCompare = moment(date);
    const hoursDifference = currentDate.diff(dateToCompare, "hours");
    if (hoursDifference >= 24) {
      return res.json({ success: false, msg: "The link already expired" });
    }
    User.findAll({ where: { username } })
      .then((user) => {
        if (!user.length) {
          return res.json({ success: false, msg: "user not found" });
        } else {
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
              console.log(err);
              console.log(hash)
              if (err) throw err;
              User.update({ password: hash }, { where: { username } })
                .then((user) => {
                  res.json({
                    success: true,
                    msg: "Updated successfully",
                    user: user,
                  });
                })
                .catch((err) => {
                  console.log(err);
                  res.status(500).json({ err });
                });
            });
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ err });
      });
  });
};

const create = (req, res) => {
  let {
    firstname = "",
    lastname = "",
    dob = "",
    phone = "",
    image = "",
    username = "",
    password = "",
    email = "",
  } = req.body;

  User.findAll({ where: { username } }).then((user) => {
    if (user.length) {
      return res.status(400).json({ message: "Username already exists!" });
    } else {
      let newUser = {
        firstname,
        lastname,
        dob,
        phone,
        image,
        username,
        password,
        email,
      };
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          User.create(newUser)
            .then((user) => {
              jwt.sign(
                {
                  username,
                  email,
                  date: moment().format("YYYY-MM-DD hh:mm:ss"),
                },
                process.env.JWT_SECRET,
                {
                  expiresIn:  "24h",
                },
                (err, token) => {
                  console.log(err);
                  transporter.sendMail(
                    mailOptions({
                      in_from: '"NEXIFOUR ALBUM" <from@example.com>',
                      in_to: email,
                      subject: "Please confirm your email",
                      template_name: "confirmationMail",
                      context: {
                        name: `${firstname} ${lastname}`,
                        link: `https://album.nexifour.com/email-confirmed?token=${token}`,
                      },
                    }),
                    function (error, info) {
                      console.log(error, info);
                      if (error) {
                        res.status(500).json({
                          success: false,
                          message: "email not sent",
                          error,
                        });
                      } else {
                        res.status(200).json({
                          success: true,
                          message: "email sent",
                          info: info.response,
                        });
                      }
                    }
                  );
                }
              );
            })
            .catch((err) => {
              res.status(500).json({ err });
            });
        });
      });
    }
  });
};

const verifyEmail = (req, res) => {
  const { token } = req.params;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.json({
        success: false,
        msg: "Failed to authenticate token.",
        err,
      });
    }
    const { username, date } = decoded;
    console.log(date);

    const currentDate = moment();
    const dateToCompare = moment(date);
    const hoursDifference = currentDate.diff(dateToCompare, "hours");
    if (hoursDifference >= 24) {
      return res.json({ success: false, msg: "The link already expired" });
    }
    User.findAll({ where: { username } })
      .then((user) => {
        if (!user.length) {
          return res.json({ success: false, msg: "user not found" });
        }
        if (user[0].status === "verified") {
          return res.json({ success: false, msg: "already verified" });
        } else {
          User.update({ status: "verified" }, { where: { username } })
            .then((user) => {
              res.json({
                success: true,
                msg: "verified successfully",
                user: user,
              });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ err });
            });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ err });
      });
  });
};
const deActivateAccount = (req, res) => {
  const { username } = req.body;
  User.update({ status: "suspended" }, { where: { username } })
    .then((user) => {
      res.json({ success: true, message: "Updated successfully", user });
    })
    .catch((err) => res.status(500).json({ success: false, err }));
};

const updateUserInfo = (req, res) => {
  const { username, phone, email, profession, marital_status, id } = req.body;
  User.update(
    { phone, email, profession, marital_status, username },
    { where: { id } }
  )
    .then((user) => {
      res.json({ success: true, message: "Updated successfully", user });
    })
    .catch((err) => res.status(500).json({ success: false, err }));
};

const updateUserSocial = (req, res) => {
  const { facebook, instagram, twitter, snapchat, tikTok, whatsapp, username } =
    req.body;
  User.update(
    { facebook, instagram, twitter, snapchat, tikTok, whatsapp },
    { where: { username } }
  )
    .then((user) => {
      res.json({ success: true, message: "Updated successfully", user });
    })
    .catch((err) => res.status(500).json({ success: false, err }));
};

const updateUserBasicInfo = (req, res) => {
  const { firstname, lastname, location, about, username } = req.body;
  User.update({ firstname, lastname, location, about }, { where: { username } })
    .then((user) => {
      res.json({ success: true, message: "Updated successfully", user });
    })
    .catch((err) => res.status(500).json({ success: false, err }));
};

const forgetPassword = (req, res) => {
  const { username } = req.body;
  User.findAll({ where: { username } })
    .then((user) => {
      if (!user.length) {
        return res.json({ message: "username not available" });
      } else {
        const { username, email, firstname, lastname } = user[0].dataValues;
        jwt.sign(
          {
            username,
            email,
            date: moment().format("YYYY-MM-DD hh:mm:ss"),
          },
          process.env.JWT_SECRET,
          {
            expiresIn:  "24h",
          },
          (err, token) => {
            console.log(err);
            console.log(token);
            transporter.sendMail(
              mailOptions({
                in_from: '"NEXIFOUR ALBUM" <from@example.com>',
                in_to: email,
                subject: "Password Recovery",
                template_name: "ResetPassword",
                context: {
                  name: `${firstname} ${lastname}`,
                  link: `https://album.nexifour.com/new-password/${token}`,
                },
              }),
              function (error, info) {
                if (error) {
                  res.status(500).json({
                    success: false,
                    message: "email not sent",
                    error,
                  });
                } else {
                  res.status(200).json({
                    success: true,
                    message: "email sent",
                    info: info.response,
                  });
                }
              }
            );
          }
        );
      }
    })
    .catch((err) => res.status(500).json({ err }));
};

const findByUsername = (req, res) => {
  const username = req.params.username;
  User.findAll({ where: { username } })
    .then((user) => {
      if (user.length) {
        return res.json({ message: "username not available" });
      }
      res.json({ message: "username is available" });
    })
    .catch((err) => res.status(500).json({ err }));
};

const login = (req, res) => {
  const { errors, isValid } = validateLoginForm(req.body);

  // check validation
  // if (!isValid) {
  //   return res.status(400).json(errors);
  // }

  const { email, password } = req.body;
  console.log(req.body);
  User.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [{ username: email }, { email }],
        },
        { status: "verify" },
      ],
    },
    limit: 1,
  })
    .then((user) => {
      //check for user
      console.log(user);
      if (!user.length) {
        errors.email = "User not found!";
        return res.status(404).json(errors);
      }

      let originalPassword = user[0].dataValues.password;

      //check for password
      bcrypt
        .compare(password, originalPassword)
        .then((isMatch) => {
          if (isMatch) {
            // user matched
            console.log("matched!");
            const { id, username } = user[0].dataValues;
            const payload = { id, username }; //jwt payload
            // console.log(payload)

            jwt.sign(
              payload,
              process.env.JWT_SECRET,
              {
                expiresIn:  "24h",
              },
              (err, token) => {
                res.json({
                  success: true,
                  token: "Bearer " + token,
                  role: user[0].dataValues.role,
                  user: user[0].dataValues,
                });
              }
            );
          } else {
            errors.password = "Password not correct";
            return res.status(400).json(errors);
          }
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => res.status(500).json({ err }));
};

// fetch all users
const findAllUsers = (req, res) => {
  User.findAll()
    .then((user) => {
      res.json({ user });
    })
    .catch((err) => res.status(500).json({ err }));
};

// fetch user by userId
const findById = (req, res) => {
  const id = req.params.userId;

  User.findAll({ where: { id } })
    .then((user) => {
      if (!user.length) {
        return res.json({ msg: "user not found" });
      }
      res.json({ user });
    })
    .catch((err) => res.status(500).json({ err }));
};

// update a user's info
const update = (req, res) => {
  let { firstname, lastname, HospitalId, role, image } = req.body;
  const id = req.params.userId;

  User.update(
    {
      firstname,
      lastname,
      role,
    },
    { where: { id } }
  )
    .then((user) => res.status(200).json({ user }))
    .catch((err) => res.status(500).json({ err }));
};

// delete a user
const deleteUser = (req, res) => {
  const id = req.params.userId;

  User.destroy({ where: { id } })
    .then(() => res.status.json({ msg: "User has been deleted successfully!" }))
    .catch((err) => res.status(500).json({ msg: "Failed to delete!" }));
};

export {
  create,
  login,
  findAllUsers,
  findByUsername,
  verifyToken,
  update,
  deleteUser,
  resetPassword,
  verifyEmail,
  deActivateAccount,
  forgetPassword,
  changePassword,
  updateUserBasicInfo,
  updateUserInfo,
  updateUserSocial
};
