const fs = require('fs');
const path = require('path');

const filePath = path.join('D:\\MostafaSaid\\ELMostafa\\backend\\src\\inventory\\inventory.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add skipStockCheck parameter
content = content.replace(
  /(manager\?: EntityManager,\n  \) \{)/,
  'manager?: EntityManager,\n    skipStockCheck?: boolean,\n  ) {'
);

// 2. Replace the OUT movement block
const oldBlock = `} else if (data.type === MovementType.OUT) {
      stock.quantity = Number(stock.quantity) - Number(data.quantity);
    }`;

const newBlock = `} else if (data.type === MovementType.OUT) {
      const currentQty = Number(stock.quantity);
      const deductQty = Number(data.quantity);
      if (!skipStockCheck && deductQty > currentQty) {
        throw new BadRequestException(
          \`\u0627\u0644\u0645\u062e\u0632\u0648\u0646 \u063a\u064a\u0631 \u0643\u0627\u0641: \u0627\u0644\u0645\u062a\u0627\u062d \${currentQty} \u0648\u0627\u0644\u0645\u0637\u0644\u0648\u0628 \${deductQty}\`,
        );
      }
      stock.quantity = currentQty - deductQty;
    }`;

content = content.replace(oldBlock, newBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Written');

const check = fs.readFileSync(filePath, 'utf8');
console.log('skipStockCheck:', check.includes('skipStockCheck'));
console.log('deductQty:', check.includes('deductQty'));
