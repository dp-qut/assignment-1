# How to Add Background Image to Login/Register Pages

## Step 1: Add Your Background Image

1. Copy your background image to the `src/assets` folder
2. Recommended image specifications:
   - Format: JPG, PNG, or WebP
   - Size: At least 1920x1080 pixels
   - File size: Optimized for web (under 500KB recommended)

## Step 2: Update the Import Statements

In both `Login.js` and `Register.js`, uncomment and update the import line:

```javascript
// Change this line:
// import backgroundImage from '../../assets/login-background.jpg';

// To this (replace with your actual image name):
import backgroundImage from '../../assets/your-image-name.jpg';
```

## Step 3: Update the Background Style

In both files, uncomment the backgroundImage line:

```javascript
// Change this:
// backgroundImage: `url(${backgroundImage})`,

// To this:
backgroundImage: `url(${backgroundImage})`,
```

## Current Implementation

The code is already set up with:
- ✅ Background image support (commented out)
- ✅ Fallback gradient if image fails to load
- ✅ Dark overlay for better text readability
- ✅ Glass effect on the form cards
- ✅ Responsive design
- ✅ Full viewport coverage

## Example File Structure

```
src/
  assets/
    login-background.jpg     ← Your background image
    README.md
    authPageStyles.js
  components/
    auth/
      Login.js              ← Updated with background image support
      Register.js           ← Updated with background image support
```

## Recommended Background Images

For a visa application portal, consider these types of images:
- Airport or travel scenes
- Passport and documents
- World landmarks
- Professional office environments
- Abstract patterns with blue/corporate colors

## Tips

1. Test your image on different screen sizes
2. Ensure text remains readable with the overlay
3. Optimize image size for faster loading
4. Consider using WebP format for better compression
5. Test with slow internet connections
