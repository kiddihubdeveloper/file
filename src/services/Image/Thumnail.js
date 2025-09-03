import { Jimp } from "jimp";
import readFile from "../../clients/S3/support/ReadFile.js";

/**
 * Calculate the crop size for an image to fit a target aspect ratio.
 * @param {Jimp} image
 * @param {number} targetWidth
 * @param {number} targetHeight
 */
function calcSize(image, targetWidth, targetHeight) {
  const { width, height } = image.bitmap;

  // Validate inputs
  if (!width || !height || width <= 0 || height <= 0) {
    throw new Error(`Invalid image dimensions: ${width}x${height}`);
  }
  if (!targetWidth || !targetHeight || targetWidth <= 0 || targetHeight <= 0) {
    throw new Error(
      `Invalid target dimensions: ${targetWidth}x${targetHeight}`
    );
  }

  const targetRatio = targetWidth / targetHeight;
  const sourceRatio = width / height;
  let cropWidth, cropHeight;

  if (sourceRatio > targetRatio) {
    // Image is wider → crop horizontally
    cropHeight = height;
    cropWidth = Math.floor(height * targetRatio);
  } else {
    // Image is taller → crop vertically
    cropWidth = width;
    cropHeight = Math.floor(width / targetRatio);
  }
  const x = Math.floor((width - cropWidth) / 2);
  const y = Math.floor((height - cropHeight) / 2);

  // Final validation to ensure no NaN values
  if (isNaN(x) || isNaN(y) || isNaN(cropWidth) || isNaN(cropHeight)) {
    throw new Error(
      `Invalid crop calculations: x=${x}, y=${y}, width=${cropWidth}, height=${cropHeight}`
    );
  }

  return { width: cropWidth, height: cropHeight, x, y };
}

export default {
  /**
   * Make a thumbnail from an image file.
   * @param {string|Express.Multer.File} file
   * @param {{width: number, height: number} | {max_width: number, max_height: number}} config
   */
  async makeOne(file, config) {
    try {
      const { buffer, originalname } = await readFile(file);

      const image = await Jimp.fromBuffer(buffer);

      // Handle both thumbnail config (width/height) and original config (max_width/max_height)
      const targetWidth = config.width || config.max_width;
      const targetHeight = config.height || config.max_height;

      if (!targetWidth || !targetHeight) {
        throw new Error(
          `Invalid config: missing dimensions. Received: ${JSON.stringify(
            config
          )}`
        );
      }

      const { x, y, width, height } = calcSize(
        image,
        targetWidth,
        targetHeight
      );
      image.crop({
        x,
        y,
        w: width,
        h: height,
      });
      image.resize({
        w: targetWidth,
        h: targetHeight,
        mode: Jimp.RESIZE_BILINEAR,
      });
      const fs = await import("fs/promises");
      const path = await import("path");
      const dir = path.dirname(`tmp/digest/${originalname}`);
      await fs.mkdir(dir, { recursive: true });
      const newFilePath = `tmp/digest/${originalname}`;
      await image.write(newFilePath);
      return newFilePath;
    } catch (err) {
      console.error("[Thumnail.makeOne] ERROR:", err, file);
      throw err;
    }
  },
  /**
   * Make many thumbnails from an array of image files.
   * @param {Array<Express.Multer.File>} files
   * @param {Array<{width: number, height: number}>} config
   * @returns {Promise<Array<string|null>>}
   */
  async makeMany(files, config) {
    return config
      .map(({ width, height }, index) => {
        if (files[index]) {
          return this.makeOne(files[index], { width, height });
        }
        return null;
      })
      .filter((item) => item !== null);
  },
};
