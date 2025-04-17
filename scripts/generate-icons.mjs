import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Adjust this path to point to your folder containing the raw SVG files
const svgSourceFolder = path.resolve(__dirname, 'icons/'); // Example: project_root/assets/icons
// Adjust this path to point to your target icons.tsx file
const targetIconFile = path.resolve(__dirname, '../components/icons.tsx');
// --- End Configuration ---


// Helper to convert kebab-case or snake_case to PascalCase for component names
function toPascalCase(str) {
    return str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map(x => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
        .join('');
}

// Extracts viewBox and inner content from SVG string
function parseSvgContent(svgString) {
    const viewBoxMatch = svgString.match(/viewBox="([^"]*)"/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24'; // Default if not found

    // Extract content between the first > and the last </svg>
    const innerContentMatch = svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    let innerContent = innerContentMatch ? innerContentMatch[1].trim() : '';

    if (!innerContent) {
        console.warn('Could not extract inner content for an SVG.');
        return { viewBox, innerContent: '' };
    }

    // Clean the inner content for JSX compatibility
    let cleanedContent = innerContent
        .replace(/<!--.*?-->/gs, '') // Remove comments
        .replace(/<defs>.*?<\/defs>/gs, '') // Remove defs blocks
        .replace(/<style>.*?<\/style>/gs, '') // Remove style blocks
        .replace(/class="/g, 'className="') // Replace class with className
        .replace(/data-name="[^"]*"/g, '') // Remove data-name attributes
        .replace(/id="[^"]*"/g, '') // Remove id attributes (optional, but often good)
        .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
        .trim();

    // Optional: Remove fill/stroke attributes from inner elements if you want *everything*
    // to inherit from the top-level SVG's currentColor.
    // Be cautious with this, as it might break multi-color icons.
    // cleanedContent = cleanedContent.replace(/\s(fill|stroke)="[^"]*"/g, '');

    return { viewBox, innerContent: cleanedContent };
}

// Generates the React component string
function createComponentString(componentName, viewBox, innerContent) {
    // Ensure props like fill/stroke use currentColor if not specified
    // This template assumes the SVG paths themselves might use currentColor or specific colors
    return `
export const ${componentName} = ({ size = 16, className = '' }: { size?: number, className?: string }) => {
  return (
    <svg
      height={size}
      width={size}
      viewBox="${viewBox}"
      fill="currentColor" // Apply fill at the SVG level, paths can override
      stroke="currentColor" // Apply stroke at the SVG level, paths can override
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color: 'currentcolor' }} // Ensures CSS color cascades
    >
      ${innerContent}
    </svg>
  );
};
`;
}


async function processIcons() {
    console.log(`Source SVG folder: ${svgSourceFolder}`);
    console.log(`Target file: ${targetIconFile}`);

    let svgFiles;
    try {
        svgFiles = await fs.readdir(svgSourceFolder);
        svgFiles = svgFiles.filter(file => path.extname(file).toLowerCase() === '.svg');
        console.log(`Found ${svgFiles.length} SVG files.`);
    } catch (err) {
        console.error(`Error reading source folder "${svgSourceFolder}":`, err.message);
        console.error("Please ensure the 'svgSourceFolder' path is correct in the script.");
        process.exit(1);
    }

    if (svgFiles.length === 0) {
        console.log('No SVG files found to process.');
        return;
    }

    let componentsAdded = 0;
    let existingContent = '';
    try {
        existingContent = await fs.readFile(targetIconFile, 'utf-8');
    } catch (err) {
        console.warn(`Target file ${targetIconFile} not found or couldn't be read. Will create if needed, but existing content check won't run.`);
    }


    const componentsToAppend = [];

    for (const file of svgFiles) {
        const baseName = path.basename(file, '.svg');
        const componentName = `${toPascalCase(baseName)}Icon`;

        // Basic check if component already exists (by exact name match)
        if (existingContent.includes(`export const ${componentName}`)) {
            console.log(`Skipping: Component "${componentName}" seems to already exist in ${targetIconFile}.`);
            continue;
        }

        const filePath = path.join(svgSourceFolder, file);
        try {
            const svgContent = await fs.readFile(filePath, 'utf-8');
            const { viewBox, innerContent } = parseSvgContent(svgContent);

            if (!innerContent) {
                 console.warn(`Skipping ${file}: Could not parse inner content.`);
                 continue;
            }

            const componentString = createComponentString(componentName, viewBox, innerContent);
            componentsToAppend.push(componentString);
            console.log(`Prepared component: ${componentName}`);
            componentsAdded++;
        } catch (err) {
            console.error(`Error processing file ${file}:`, err.message);
        }
    }

    if (componentsToAppend.length > 0) {
        try {
            await fs.appendFile(targetIconFile, '\n' + componentsToAppend.join('\n'));
            console.log(`\nSuccessfully added ${componentsAdded} new icon component(s) to ${targetIconFile}`);
            console.log('Please review the changes and format the file if necessary (e.g., using Prettier).');
        } catch (err) {
            console.error(`Error writing to target file ${targetIconFile}:`, err.message);
        }
    } else {
        console.log('\nNo new components needed to be added.');
    }
}

processIcons(); 