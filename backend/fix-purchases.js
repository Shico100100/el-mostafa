const fs = require('fs');
const path = require('path');

const filePath = path.join('D:\\MostafaSaid\\ELMostafa\\backend\\src\\purchases\\purchases.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add true parameter to updateOrder reversal call
// Pattern: queryRunner.manager,\n          );\n        }\n\n        // Delete existing items
// Pattern for updateOrder: the one followed by "// Delete existing items" on the next line after );
content = content.replace(
  /(queryRunner\.manager,\n          \);\n        }\n\n        \/\/ Delete existing items)/,
  'queryRunner.manager,\n            true,\n          );\n        }\n\n        // Delete existing items'
);

// Add true parameter to deleteOrder reversal call
// Pattern: queryRunner.manager,\n        );\n      }\n\n      // Reverse supplier balance
content = content.replace(
  /(queryRunner\.manager,\n        \);\n      }\n\n      \/\/ Reverse supplier balance)/,
  'queryRunner.manager,\n          true,\n        );\n      }\n\n      // Reverse supplier balance'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Written');

// Verify
const check = fs.readFileSync(filePath, 'utf8');
console.log('true count:', (check.match(/true,/g) || []).length);
