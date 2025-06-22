/*
  # Seed Default Categories

  1. New Data
    - Default income categories
    - Default expense categories
  
  2. Purpose
    - Provide initial categories for new users
*/

-- Function to create default categories for a new user
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Income categories
  INSERT INTO public.categories (user_id, name, type, color, is_default)
  VALUES
    (NEW.id, 'Gaji', 'income', '#10B981', TRUE),
    (NEW.id, 'Freelance', 'income', '#3B82F6', TRUE),
    (NEW.id, 'Investasi', 'income', '#8B5CF6', TRUE),
    (NEW.id, 'Bisnis', 'income', '#F59E0B', TRUE),
    (NEW.id, 'Bonus', 'income', '#EF4444', TRUE),
    (NEW.id, 'Hadiah', 'income', '#EC4899', TRUE),
    (NEW.id, 'Penjualan', 'income', '#06B6D4', TRUE),
    (NEW.id, 'Lainnya', 'income', '#6B7280', TRUE);

  -- Expense categories
  INSERT INTO public.categories (user_id, name, type, color, is_default)
  VALUES
    (NEW.id, 'Makanan & Minuman', 'expense', '#EF4444', TRUE),
    (NEW.id, 'Transportasi', 'expense', '#3B82F6', TRUE),
    (NEW.id, 'Hiburan', 'expense', '#8B5CF6', TRUE),
    (NEW.id, 'Belanja', 'expense', '#EC4899', TRUE),
    (NEW.id, 'Tagihan', 'expense', '#F59E0B', TRUE),
    (NEW.id, 'Kesehatan', 'expense', '#10B981', TRUE),
    (NEW.id, 'Pendidikan', 'expense', '#06B6D4', TRUE),
    (NEW.id, 'Rumah Tangga', 'expense', '#84CC16', TRUE),
    (NEW.id, 'Pakaian', 'expense', '#F97316', TRUE),
    (NEW.id, 'Teknologi', 'expense', '#6366F1', TRUE),
    (NEW.id, 'Olahraga', 'expense', '#14B8A6', TRUE),
    (NEW.id, 'Lainnya', 'expense', '#6B7280', TRUE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to add default categories when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_categories();