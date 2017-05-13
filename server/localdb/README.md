# 说明
* 该目录用于存放MongoDB的数据和日志，请保证该目录有足够大的空间
* 如需迁移数据库存放地址，请在server/config.js文件中进行配置

# 首次配置
1. 首先关闭`auth`选项启动数据库，然后使用命令`mongo 127.0.0.1:27077`接入数据库。
2. 使用`use admin`进入`admin`数据库，创建`userAdminAnyDatabase`角色。
3. 使用`use gtip`进入`gtip`数据库，创建`dbOwner`角色，注意用户名和密码与`config.js`文件里的配置一致。
4. 创建配置数据库`db.createCollection('config')`。
5. 使用`use admin`和`db.shutdownServer()`关闭数据库，然后开启`auth`选项启动数据库。
