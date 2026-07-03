-- Fix negative stock quantities to 0
UPDATE stock SET quantity = 0 WHERE quantity < 0;

-- Show what was fixed
SELECT id, product_id, quantity AS old_quantity, 0 AS new_quantity
FROM stock WHERE quantity < 0;
