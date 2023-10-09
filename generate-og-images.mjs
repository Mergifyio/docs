import fs from 'fs'
import {createCanvas, loadImage} from 'canvas'
import {resolve} from 'path';

const removeTrailingSlash = (str) => {
  if (str.endsWith("/")) {
    return str.slice(0, -1);
  }
  return str;
}

/** writeFileSync does not create dir if it don't exist, we need to do it ourselves */
const saveImage = (path, content) => {
  let filepath = path.replace(/\\/g,'/'); // Normalize path in case of Windows
  let root = '';

  if (filepath[0] === '/') { 
    root = '/'; 
    filepath = filepath.slice(1);
  } 

  const folders = filepath.split('/').slice(0, -1);
  folders.reduce(
    (acc, folder) => {
      const folderPath = acc + folder + '/';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }
      return folderPath
    },
    root
  ); 

  fs.writeFileSync(root + filepath, content);
}

export const generateImage = async (title, path) => {
  if (path === '/' || title == null) return; // Skip Home page
  const canvas = createCanvas(1200, 630)
  const ctx = canvas.getContext("2d");

  const image = await loadImage(resolve('./static/og-template.jpg'))
  ctx.drawImage(image, 0, 0)

  ctx.font = 'normal normal 300 64px Poppins';
  ctx.fillStyle = 'black';

  const words = title.split(" ");

  let x = 74;
  let y = 350;
  const shouldBreakLine = ctx.measureText(title).width + x >= canvas.width;

  if (shouldBreakLine) {
    // Start with a lower Y if line should break, to give the next line space to draw
    y = 280;
  }
  
  for (const word of words) {
    if ((x + ctx.measureText(word).width) >= canvas.width) {
      y += ctx.measureText("M").width + 20;
      x = 74;
    }
    
    ctx.fillText(word, x, y);
    x += ctx.measureText(word).width + ctx.measureText(" ").width;
  }
  
  const buffer = canvas.toBuffer('image/png')
  saveImage(resolve(`./static/og-images/${removeTrailingSlash(path)}.png`), buffer)
};