const { Sequelize, DataTypes } = require('sequelize');
const mysql = require('mysql2');
const fs = require('fs');

const sequelize = new Sequelize('pki-cloud', 'pkicloud', 'zaq1@WSX', {
    host: 'pki-cloud.mysql.database.azure.com',
    dialect: 'mysql',
    dialectOptions: {
        ssl: {
            ca: fs.readFileSync('./DigiCertGlobalRootCA.crt')
        }
    }
});

const Users = sequelize.define('users', {
id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
},
username: {
    type: DataTypes.STRING,
    allowNull: true
},
email: {
    type: DataTypes.STRING,
    allowNull: false
},
password: {
    type: DataTypes.STRING,
    allowNull: true
},
roleId: {
    type: DataTypes.INTEGER,
    allowNull: false
},
isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
},
provider: {
    type: DataTypes.STRING,
    allowNull: true
}
});

const Roles = sequelize.define('roles', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const DatasourcePublic = sequelize.define('public', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    data: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const DatasourcePrivate = sequelize.define('private', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    data: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const DatasourceAdmin = sequelize.define('admin', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    data: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = {
    existsUserByEmail: async (givenEmail) => {
        try {
            const user = await Users.findOne({
                where: {
                    email: givenEmail
                }
            })
            if(user) return true;
            
            return false;
        } catch(error){
            console.log(`Error while searching ${error}`);
            return false;
        }
    },
    createUser: async (givenEmail, givenUsername, givenPassword, givenProvider) => {
        try{
            const user = {username: givenUsername, email: givenEmail, password: givenPassword, roleId: 2, provider: givenProvider};
            console.log("user database: ", user);
            await Users.create(user);
            const find = await Users.findOne({
                where: {
                    email: user.email
                }
            })
            return find;
        } catch(error){
            console.log(`Error while creating user ${error}`);
            return false;
        }
    },
    matchPasswordByEmail: async (givenEmail, givenPassword) => {
        try{
            const user = await Users.findOne({
                where: {
                    email: givenEmail,
                    password: givenPassword
                }
            })

            if(user && user.isActive === true) return true;

            return false;
        } catch(error){
            console.log(`Error ${Error}`);
            return false;
        }
    },
    getUserIdByEmail: async (givenEmail) => {
        console.log("givenEmail ", givenEmail);
        try {
            const user = await Users.findOne({
                where: {
                    email: givenEmail
                }
            })
            console.log("gówno: ", user)
            if(user){
                return JSON.parse(user.id);
            }
            
            return null;
        } catch(error){
            console.log(`Error while searching ${error}`);
            return null;
        }
    },
    getAllUsers: async () => {
        try {
            const users = await Users.findAll()
            if(users) return users;
            
            return null;
        } catch(error){
            console.log(`Error while searching ${error}`);
            return null;
        }
    },
    getUserRoleById: async (givenId) => {
        try {
            const userRole = await Users.findOne({
                where: {
                    id: givenId
                }
            })
            const role = await Roles.findOne({
                where: {
                    id: userRole.roleId
                }
            })
            console.log(role.name)
            if(role) return role.name;
            
            return null;
        } catch(error){
            console.log(`Error while searching ${error}`);
            return null;
        }
    },
    changeStatusById: async (givenId) => {
        try {
            Users.update(
                    {isActive: Sequelize.literal('NOT "isActive"')},
                    {where: {id: givenId}}
            )
        } catch(error){
            console.log(`Error while searching ${error}`);
            return null;
        }
    },
    getPublicResources: async () => {
        return (await DatasourcePublic.findAll());
    },
    getPrivateResources: async (givenRole) => {
        console.log(`givenRole: ${givenRole}`)
        if(givenRole != 'admin' && givenRole != 'user'){
            return null;
        }
        return (await DatasourcePrivate.findAll());
    },
    getAdminResources: async (givenRole) => {
        if(givenRole != 'admin'){
            return null;
        }
        return (await DatasourceAdmin.findAll());
    },
    deleteInactiveUsers: async () => {
        try {
            await Users.destroy({
              where: {
                isActive: false
              }
            });
            console.log('Inactive users deleted successfully');
          } catch (error) {
            console.error('Error deleting inactive users:', error);
          }
    },
    createFromSchemas: async () => {
        try {
            await Users.sync({ force: true });
            console.log('Users table created successfully');
            await Roles.sync({ force: true });
            console.log('Roles table created successfully');
            await DatasourcePublic.sync({force: true})
            await DatasourcePrivate.sync({force: true})
            await DatasourceAdmin.sync({force: true})

            Users.belongsTo(Roles, {foreignKey: 'roleId'});
            Roles.hasMany(Users, {foreignKey: 'roleId'})

            await Roles.create({name: 'admin'})
            await Roles.create({name: 'user'})

            await Users.create({username: 'admin', password: 'admin', email: 'admin@admin', roleId: 1, isActive: true})

            await DatasourcePublic.create({data: "PUBLIC"})
            await DatasourcePrivate.create({data: "SECRET"})
            await DatasourceAdmin.create({data: "SUPER SECRET"})

        } catch (err) {
            console.error('Error creating table(s)', err);
    }}
};
