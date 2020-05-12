[![Paypal.me donate](https://img.shields.io/badge/Paypal.me-donate-yellow.svg)](https://www.paypal.me/lzppzr)

### Docker(可避免执行环境问题)
  1. 安装[Git](https://git-scm.com/downloads) `// 务必添加到环境变量, 不然建立Docker镜像时候报错`
  2. 安装[Docker](https://docs.docker-cn.com/engine/installation/)
  3. 建立Docker镜像 `docker build https://github.com/bilive/bilive_server.git -t bilive_server`
  4. 启动容器 `docker run -itd -p 20080:20080 bilive_server`

### 自行编译
  * 第一次使用
    1. 安装[Git](https://git-scm.com/downloads)
    2. 安装[Node.js](https://nodejs.org/)
    3. 命令行 `git clone https://github.com/bilive/bilive_server.git`
    4. 命令行 `cd bilive_server`
    5. 命令行 `mkdir options`
    6. 命令行 `cp nedb/roomList.db options/roomList.db`
    7. 命令行 `npm install`
    8. 命令行 `npm run build`
    9. 命令行 `npm start`
  * 版本更新
    1. 定位到目录
    2. 命令行 `git pull`
    3. 命令行 `npm install`
    4. 命令行 `npm run build`
    5. 命令行 `npm start`

[点此进行设置](http://github.halaal.win/bilive_client/#path=ws://localhost:20080&protocol=admin)

此为服务端, 仅用来监听房间弹幕, 更多功能请使用客户端
[客户端](https://github.com/bilive/bilive_client)