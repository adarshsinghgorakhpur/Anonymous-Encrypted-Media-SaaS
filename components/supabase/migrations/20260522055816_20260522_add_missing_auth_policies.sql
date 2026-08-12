/*
  # Add Missing Authentication Policies and Triggers

  1. Auth Policies
    - Add INSERT policy for profiles (enables user signup)
    - Add DELETE policy for profiles (admins only)
  
  2. Auth Triggers
    - Create subscription record when user signs up
    - Initialize storage tracking
  
  3. Purpose
    - Fix "Database error saving new user" by allowing profile INSERT
    - Auto-create free subscription for new users
    - Enable proper auth workflow
*/

-- 1. Add missing INSERT policy for profiles (enables signup)
CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 2. Add DELETE policy for profiles (admins only)
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- 3. Create or update subscription trigger for new users
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_subscription_on_user_create ON profiles;

-- Create trigger for new profiles
CREATE TRIGGER create_subscription_on_user_create
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_subscription();
