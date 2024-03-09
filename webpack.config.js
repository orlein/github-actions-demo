/* eslint-disable @typescript-eslint/no-var-requires */
const CopyPlugin = require('copy-webpack-plugin');
const path = require('node:path');
const fs = require('node:fs');
const yaml = require('js-yaml');

module.exports = function (options, webpack) {
  const dotPnpmPath = path.resolve(__dirname, 'node_modules', '.pnpm');
  const lockFilePath = path.resolve(__dirname, 'pnpm-lock.yaml');

  const isPnpm = fs.existsSync(dotPnpmPath) && fs.existsSync(lockFilePath);

  const patterns = (() => {
    if (!isPnpm) {
      return [
        {
          from: 'swagger-ui.css',
          context: 'node_modules/swagger-ui-dist/',
        },
        {
          from: 'favicon-32x32.png',
          context: 'node_modules/swagger-ui-dist/',
        },
        {
          from: 'favicon-16x16.png',
          context: 'node_modules/swagger-ui-dist/',
        },
        {
          from: 'swagger-ui-bundle.js',
          context: 'node_modules/swagger-ui-dist/',
        },
        {
          from: 'swagger-ui-standalone-preset.js',
          context: 'node_modules/swagger-ui-dist/',
        },
      ];
    }

    const lockFile = yaml.load(fs.readFileSync(lockFilePath, 'utf-8'));
    const swaggerUiDist = Object.keys(lockFile.packages).find((key) =>
      key.includes('swagger-ui-dist'),
    );

    if (!lockFile?.packages[swaggerUiDist]) {
      return [];
    }

    const swaggerPath = swaggerUiDist.replace('/', '');
    const context = `node_modules/.pnpm/${swaggerPath}/node_modules/${
      swaggerPath.split('@')[0]
    }/`;

    return [
      {
        from: 'swagger-ui.css',
        context,
      },
      {
        from: 'favicon-32x32.png',
        context,
      },
      {
        from: 'favicon-16x16.png',
        context,
      },
      {
        from: 'swagger-ui-bundle.js',
        context,
      },
      {
        from: 'swagger-ui-standalone-preset.js',
        context,
      },
    ];
  })();

  /**
   * @type {import('webpack').Configuration}
   */
  return {
    ...options,
    externals: [],
    // mode: 'production',
    module: {
      rules: [
        {
          test: /\.(ts|js)$/,
          exclude: /node_modules/,
          loader: 'swc-loader',
        },
        {
          // "Fixes" build issue as suggested by @[linsolas](https://github.com/linsolas)
          //  https://github.com/nestjs/terminus/issues/1423#issue-1002145070
          test: /@nestjs\/terminus\/dist\/utils\/.*$/,
          loader: 'null-loader',
        },
      ],
    },
    target: 'node',
    plugins: [
      ...options.plugins,
      patterns.length > 0 &&
        new CopyPlugin({
          patterns: [...patterns],
        }),
      new webpack.IgnorePlugin({
        checkResource(resource) {
          const lazyImports = [
            '@nestjs/mongoose',
            '@nestjs/sequelize',
            '@nestjs/sequelize/dist/common/sequelize.utils',
            '@nestjs/websockets/socket-module',
            '@mikro-orm/core',
            'pg-native',
            '@nestjs/microservices',
            '@nestjs/microservices/microservices-module',
            '@nestjs/websockets',
            '@nestjs/websockets/socket-module',
            'cache-manager',
            'class-validator',
            'class-transformer',
            'class-transformer/storage',
          ];
          if (!lazyImports.includes(resource)) {
            return false;
          }
          try {
            require.resolve(resource, {
              paths: [process.cwd()],
            });
          } catch (err) {
            return true;
          }
          return false;
        },
      }),
    ],
  };
};
