import fs from 'fs';

export const ScalarApiReference = () => ({
  name: 'client:staticScalarApiReference',
  hooks: {
    'astro:config:setup': () => {
      fs.copyFile(
        'node_modules/@scalar/api-reference/dist/browser/standalone.js',
        'public/scalar-api-reference.js',
        (err) => {
          if (err) throw err;
        }
      );
    },
  },
});
