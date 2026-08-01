-- Drop the trigger that automatically creates "My Workspace" for new users
DROP TRIGGER IF EXISTS on_profile_created_create_workspace ON public.profiles;

-- Drop the function that the trigger calls
DROP FUNCTION IF EXISTS public.handle_new_user_workspace();
