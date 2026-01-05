CREATE OR REPLACE FUNCTION public.handle_auth_user_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
  new_school_id UUID;
BEGIN
  ------------------------------------------------------------------
  -- PART 1: USER CREATED (AFTER INSERT)
  ------------------------------------------------------------------
  IF TG_OP = 'INSERT' THEN
    user_role := NEW.raw_user_meta_data->>'role';
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

    -- Validate role early
    IF user_role NOT IN ('super_admin', 'admin', 'teacher', 'student') THEN
      RAISE EXCEPTION 'Invalid role provided';
    END IF;

    ----------------------------------------------------------------
    -- SUPER ADMIN → CREATE SCHOOL
    ----------------------------------------------------------------
    IF user_role = 'super_admin' THEN
      INSERT INTO public.schools (school_name)
      VALUES (
        COALESCE(
          NEW.raw_user_meta_data->>'school_name',
          'My School'
        )
      )
      RETURNING id INTO new_school_id;
    ELSE
      -- Other roles MUST supply school_id
      new_school_id := (NEW.raw_user_meta_data->>'school_id')::uuid;
      IF new_school_id IS NULL THEN
        RAISE EXCEPTION 'school_id is required for role %', user_role;
      END IF;
    END IF;

    ----------------------------------------------------------------
    -- CREATE PROFILE (IDEMPOTENT)
    ----------------------------------------------------------------
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role,
      school_id
    )
    VALUES (
      NEW.id,
      NEW.email,
      user_full_name,
      user_role,
      new_school_id
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  ------------------------------------------------------------------
  -- PART 2: USER CONFIRMED (AFTER UPDATE)
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
        employee_number,
        first_name,
        last_name,
        phone,
        email,
        gender,
        qualification,
        date_hired
      )
      VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'school_id')::uuid,
        NEW.raw_user_meta_data->>'employee_number',
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Teacher'),
        NEW.raw_user_meta_data->>'phone',
        NEW.email,
        NEW.raw_user_meta_data->>'gender',
        NEW.raw_user_meta_data->>'qualification',
        (NEW.raw_user_meta_data->>'date_hired')::date
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
        stream_id,
        admission_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        guardian_name,
        guardian_phone,
        address
      )
      VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'school_id')::uuid,
        (NEW.raw_user_meta_data->>'stream_id')::uuid,
        NEW.raw_user_meta_data->>'admission_number',
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Student'),
        (NEW.raw_user_meta_data->>'date_of_birth')::date,
        NEW.raw_user_meta_data->>'gender',
        NEW.raw_user_meta_data->>'guardian_name',
        NEW.raw_user_meta_data->>'guardian_phone',
        NEW.raw_user_meta_data->>'address'
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
