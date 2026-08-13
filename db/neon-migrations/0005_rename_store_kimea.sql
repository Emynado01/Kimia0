UPDATE store_settings
SET store_name = 'Kimea', updated_at = now()
WHERE id = 'store_kimia';

UPDATE product_images
SET alt_text = replace(alt_text, 'KiMiA', 'Kimea')
WHERE alt_text LIKE '%KiMiA%';
