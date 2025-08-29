# Image Upload Service Refactor

### Main Entry Point

- `src/services/Image/uploadImage.js` - Main upload function with simplified logic

### Helper Modules

#### `src/services/Image/helpers/fileNameBuilder.js`

- `buildFileName(base, device, prefix)` - Constructs filenames with device suffixes
- `buildResponseFileName(base, category, prefix)` - Creates response format for client

#### `src/services/Image/helpers/deviceProcessor.js`

- `processDeviceVariant(file, category, device, size, prefix)` - Handles single device processing
- `cleanupFiles(filePaths)` - Cleans up temporary files

#### `src/services/Image/helpers/categoryHandlers.js`

- `handleSchoolThumbnail(fileList, thumbConfig, category, prefix)` - Special school-thumbnail logic
- `handleOtherCategories(fileList, thumbConfig, category, prefix)` - Standard category processing

## Benefits of Refactoring

### 1. Separation of Concerns

- File naming logic separated from upload logic
- Device processing isolated into reusable functions
- Category-specific handling modularized

### 2. Improved Readability

- Main function reduced from 254 lines to ~70 lines
- Each helper function has a single responsibility
- Clear function names and documentation

### 3. Better Maintainability

- Changes to filename logic only require updating one file
- Device processing logic is reusable
- Easy to add new category handlers

### 4. Enhanced Testability

- Each helper function can be tested independently
- Mocking dependencies is easier
- Unit tests can focus on specific functionality

## Function Responsibilities

### uploadImage.js (Main)

- Route requests to appropriate handlers
- Handle configuration validation
- Coordinate single file uploads

### fileNameBuilder.js

- Generate S3 keys with proper device suffixes
- Create client response format
- Handle prefix logic

### deviceProcessor.js

- Process individual files for specific devices
- Handle S3 upload operations
- Manage temporary file cleanup

### categoryHandlers.js

- Implement category-specific upload logic
- Handle different response formats (object vs array)
- Coordinate multi-device processing

## Usage Examples

```javascript
// Single file upload
const result = await uploadImage(file, "avatar", "user123");
// Returns: ["avatar/1693334400000-user123-image.jpg"]

// Multiple files (school-thumbnail)
const result = await uploadImage(files, "school-thumbnail", "school1");
// Returns: { mobile: [...], tablet: [...], desktop: [...] }

// Multiple files (other categories)
const result = await uploadImage(files, "content", "post1");
// Returns: ["content/1693334400000-post1-image1.jpg", "content/1693334400000-post1-image2.jpg"]
```

## Migration Notes

- All existing functionality preserved
- API interface unchanged
- Response formats maintained
- Performance improved through better organization
