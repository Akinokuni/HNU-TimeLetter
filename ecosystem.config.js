/**
 * PM2 进程管理配置
 *
 * 用途：在 Debian 服务器上管理 Next.js 生产进程
 * 敏感环境变量通过 .env.production 文件注入（由 CI/CD 流水线写入），
 * 此文件不包含任何密钥，可安全提交到版本库。
 *
 * 首次启动：pm2 start ecosystem.config.js --env production
 * 重载代码：pm2 reload web --update-env
 * 查看状态：pm2 show web
 * 开机自启：pm2 save（需先执行 pm2 startup）
 */

/** @type {import('pm2').ApplicationDeclaration[]} */
module.exports = {
  apps: [
    {
      // 进程名称，与 GitHub Variable PM2_APP_NAME 保持一致
      name: 'web',

      // 使用项目本地安装的 next 可执行文件
      script: './node_modules/.bin/next',
      args: 'start',

      // 单实例模式；如需多核可改为 'max' 并开启 cluster_mode
      instances: 1,
      exec_mode: 'fork',

      // 进程崩溃后自动重启
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      // 日志路径（logs/ 目录由服务器持久化，不被 CI/CD 覆盖）
      out_file: './logs/pm2/out.log',
      error_file: './logs/pm2/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      env_production: {
        NODE_ENV: 'production',
        // 监听端口，建议通过 nginx 反向代理对外暴露 80/443
        PORT: 3000,
        // 其余环境变量由 CI/CD 写入 .env.production，Next.js 启动时自动加载
      },
    },
  ],
};
