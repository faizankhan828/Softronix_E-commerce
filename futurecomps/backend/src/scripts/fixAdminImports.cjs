const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, '../../frontend/src/components/Admin');
// const uiDir = path.join(__dirname, '../../frontend/src/components/ui');

// Map lowercase component names to PascalCase
const componentMap = {
    'use-toast': 'use-toast',
    'toaster': 'Toaster',
    'button': 'Button',
    'input': 'Input',
    'card': 'Card',
    'dialog': 'Dialog', // Use Dialog (fixed or native)
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

// Map for lucide-react keys if needed (but usually they are correct)

function toPascalCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase()).replace(/^[a-z]/, (g) => g.toUpperCase());
}

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

            // 1. Fix UI components imports
            updatedData = updatedData.replace(/from\s+["']\.\.\/\.\.\/components\/ui\/([\w-]+)(\.tsx)?["']/g, (match, componentName) => {
                const pascalName = componentMap[componentName] || toPascalCase(componentName);
                if (componentName === 'use-toast') return 'from "@/components/ui/use-toast"';
                // Use barrel export if possible or direct file
                // futurecomps/frontend/src/components/ui/index.ts exports all
                // so "@/components/ui" is enough if we import { Name }
                // But if the code does `import Button from...` (default), we need to check.
                // mamo code mostly uses named imports `import { Button } ...`
                // BUT if it uses default import `import Button from ...`, this might break if we change to `@/components/ui`.
                // Shadcn UI components usually export default.
                // Our index.ts re-exports named exports: export { Button } from "./Button".
                // So `import { Button } from "@/components/ui"` is CORRECT.
                
                // However, updatedData might be `import { Button } from ...`
                // If it is `import Button from ...`, we need to change it to `import { Button } from ...`?
                // No, Shadcn components are `export { Button, buttonVariants }`.
                // So they are named exports in the file too usually?
                // Wait, default export is common.
                // Let's check Button.tsx. `export { Button, buttonVariants }`. 
                // It does NOT have default export?
                // Step 213: `export { Button, buttonVariants } from "./Button";` in index.ts.
                
                // Let's assume named imports for now.
                // The import statement in mamo might be `import { Button } from ...`
                
                return `from "@/components/ui/${pascalName}"`; 
            });

            // 2. Fix Utils
            updatedData = updatedData.replace(/from\s+["']\.\.\/\.\.\/lib\/utils["']/g, 'from "@/lib/utils"');
            updatedData = updatedData.replace(/from\s+["']\.\.\/lib\/utils["']/g, 'from "@/lib/utils"'); // In case relative path varies

            // 3. Fix Contexts (plural to singular)
            updatedData = updatedData.replace(/from\s+["']\.\.\/\.\.\/contexts\/([\w-]+)["']/g, 'from "@/context/$1"');
            updatedData = updatedData.replace(/from\s+["']\.\.\/contexts\/([\w-]+)["']/g, 'from "@/context/$1"');

            // 4. Fix Layouts
            // ../../components/layouts/AdminLayout -> ./AdminLayout (since we moved it to Admin dir)
            updatedData = updatedData.replace(/from\s+["']\.\.\/\.\.\/components\/layouts\/AdminLayout["']/g, 'from "./AdminLayout"');

             // 5. Fix Hooks
            updatedData = updatedData.replace(/from\s+["']\.\.\/\.\.\/hooks\/([\w-]+)["']/g, 'from "@/hooks/$1"');

            // 6. Fix API (if compatible)
            // Just normalize path for now, might need manual fix later
            // mamo: ../../api/services/...
            // futurecomps: maybe src/api/... -> @/api/...
            updatedData = updatedData.replace(/from\s+["']\.\.\/\.\.\/api\/(.*)["']/g, 'from "@/api/$1"');

            if (data !== updatedData) {
                fs.writeFile(filePath, updatedData, 'utf8', (err) => {
                    if (err) console.error('Error writing file:', file, err);
                    else console.log('Updated imports in:', file);
                });
            }
        });
    });
});
