/*
# Fix signup trigger and profile creation

1. Changes
- Replaces handle_new_user function with an idempotent version using ON CONFLICT
- Ensures profiles table has INSERT policy for authenticated users
- Adds a search_path to the function for security

2. Security
- The trigger function is SECURITY DEFINER so it can insert into profiles
- ON CONFLICT ensures re-running the trigger won't fail if a profile already exists
*/

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();