CREATE OR REPLACE FUNCTION public.handle_auth_user_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  school_exists BOOLEAN;
  new_school_id UUID;
  user_full_name TEXT;
BEGIN
  ------------------------------------------------------------------
  -- PART 1: HANDLE USER CREATION (AFTER INSERT)
  ------------------------------------------------------------------
  IF TG_OP = 'INSERT' THEN
    user_full_name := COALESCE(NEW.raw_user_meta_data ->> 'full_name', '');

    -- Check if any school exists
    SELECT EXISTS (SELECT 1 FROM public.schools) INTO school_exists;

    IF NOT school_exists THEN
      -- First user ever → create school + super_admin
      INSERT INTO public.schools (school_name)
      VALUES ('My School')
      RETURNING id INTO new_school_id;

      INSERT INTO public.profiles (id, email, full_name, role, school_id)
      VALUES (NEW.id, NEW.email, user_full_name, 'super_admin', new_school_id);

    ELSE
      -- All other users → admin (or default role)
      SELECT id INTO new_school_id FROM public.schools LIMIT 1;

      INSERT INTO public.profiles (id, email, full_name, role, school_id)
      VALUES (
        NEW.id,
        NEW.email,
        user_full_name,
        COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
        new_school_id
      );
    END IF;
  END IF;

  ------------------------------------------------------------------
  -- PART 2: HANDLE USER CONFIRMATION (AFTER UPDATE)
  ------------------------------------------------------------------
  IF TG_OP = 'UPDATE'
     AND NEW.confirmed_at IS NOT NULL
     AND OLD.confirmed_at IS NULL THEN

    ----------------------------------------------------------------
    -- TEACHER
    ----------------------------------------------------------------
    IF NEW.raw_user_meta_data->>'role' = 'teacher' THEN
      INSERT INTO public.teachers (
        user_id,
        school_id,
        first_name,
        last_name,
        email,
        subject,
        phone
      )
      VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'school_id')::uuid,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Teacher'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'subject', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', '')
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;

    ----------------------------------------------------------------
    -- STUDENT
    ----------------------------------------------------------------
    IF NEW.raw_user_meta_data->>'role' = 'student' THEN
      INSERT INTO public.students (
        user_id,
        school_id,
        first_name,
        last_name,
        email,
        grade,
        phone,
        date_of_birth,
        parent_name,
        parent_phone
      )
      VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'school_id')::uuid,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Student'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'grade', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        (NEW.raw_user_meta_data->>'date_of_birth')::date,
        COALESCE(NEW.raw_user_meta_data->>'parent_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'parent_phone', '')
      )
      ON CONFLICT (user_id) DO NOTHING;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS on_auth_user_events ON auth.users;

CREATE TRIGGER on_auth_user_events
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_events();

-- Add updated_at triggers to all tables
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON public.streams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_terms_updated_at BEFORE UPDATE ON public.terms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_examinations_updated_at BEFORE UPDATE ON public.examinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON public.results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_results_updated_at BEFORE UPDATE ON public.test_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
