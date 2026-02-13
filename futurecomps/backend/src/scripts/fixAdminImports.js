const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '../../frontend/src/components/Admin');
const uiDir = path.join(__dirname, '../../frontend/src/components/ui');

// Map lowercase component names to PascalCase if they exist in uiDir
// or just capitalize first letter as a heuristic
function toPascalCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase()).replace(/^[a-z]/, (g) => g.toUpperCase());
}

// Special cases mapping
const componentMap = {
    'use-toast': 'use-toast', // Keep as is or map to use-toast.ts
    'toaster': 'Toaster',
    'button': 'Button',
    'input': 'Input',
    'card': 'Card',
    'dialog': 'Dialog', // FixedDialog exports as Dialog? No, FixedDialog exports FixedDialog. 
                       // But mamo uses Dialog. We might need to map dialog to Dialog (native) or FixedDialog.
                       // For now, map to Dialog (the one we have in components/ui/Dialog.tsx)
    'select': 'Select',
    'dropdown-menu': 'DropdownMenu',
    'table': 'Table',
    'badge': 'Badge',
    'checkbox': 'Checkbox',
    'switch': 'Switch',
    'avatar': 'Avatar',
    'textarea': 'Textarea',
    'scroll-area': 'ScrollArea',
    'popover': 'Popover',
    'separator': 'Separator',
    'alert-dialog': 'AlertDialog',
    'alert': 'Alert',
    'progress': 'Progress',
    'radio-group': 'RadioGroup',
    'skeleton': 'Skeleton',
    'tabs': 'Tabs',
    'label': 'Label',
    'image-upload': 'ImageUpload',
    'loading-button': 'LoadingButton',
    'loading-overlay': 'LoadingOverlay',
    'navigation-menu': 'NavigationMenu',
    'logo': 'Logo',
    'rating': 'Rating',
};

fs.readdir(adminDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    files.forEach(file => {
        if (!file.endsWith('.tsx') && !file.endsWith('.ts')) return;

        const filePath = path.join(adminDir, file);
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', file, err);
                return;
            }

            let updatedData = data;

            // Replace ../../components/ui/xyz with @/components/ui/Xyz
            updatedData = updatedData.replace(/from\s+["']\.\.\/\.\.\/components\/ui\/([\w-]+)["']/g, (match, componentName) => {
                const pascalName = componentMap[componentName] || toPascalCase(componentName);
                // Check if we should use @/components/ui/ComponentName
                // But wait, our components are in frontend/src/components/ui
                // The alias @ usually points to frontend/src
                return `from "@/components/ui/${pascalName}"`;
            });

             // Replace ../../components/ui/xyz with @/components/ui/Xyz (for imports that might use double quotes)
            // The regex above handles both " and '

            // Also replace "../../lib/utils" with "@/lib/utils"
            updatedData = updatedData.replace(/from\s+["']\.\.\/\.\.\/lib\/utils["']/g, 'from "@/lib/utils"');
            
             // Replace "../../hooks/..." with "@/hooks/..."
            updatedData = updatedData.replace(/from\s+["']\.\.\/\.\.\/hooks\/([\w-]+)["']/g, 'from "@/hooks/$1"');

             // Replace "../../context/..." with "@/context/..."
            updatedData = updatedData.replace(/from\s+["']\.\.\/\.\.\/context\/([\w-]+)["']/g, 'from "@/context/$1"');
            
             // Replace "../../api/..." with "@/api/..." (if api exists)
             // mamo uses ../../api/services/...
             // futurecomps might not have the same structure. 
             // for now, let's just comment out api imports if they don't exist, OR assume we will port api services too.
             // We decided to port dashboard, so likely we need the services. 
             // But for now let's just fix the path syntax to use Alias if possible or leave relative if structure is same.
             // futurecomps structure: frontend/src/api (maybe?)
             
            if (data !== updatedData) {
                fs.writeFile(filePath, updatedData, 'utf8', (err) => {
                    if (err) console.error('Error writing file:', file, err);
                    else console.log('Updated imports in:', file);
                });
            }
        });
    });
});
