export default (sequelize, DataTypes) => {
    const Album = sequelize.define(
      "Album",
      {
        album_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        album_img: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        day: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: true, 
        },
        year: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        month: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {}
    );
    
  
    Album.associate = function (models) {
     
    };
  
    return Album;
  };
  