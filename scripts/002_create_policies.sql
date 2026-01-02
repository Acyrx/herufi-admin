-- RLS Policies for Schools
CREATE POLICY "Users can view their own school" ON public.schools
  FOR SELECT USING (
    id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Super admins can update their school" ON public.schools
  FOR UPDATE USING (
    id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- RLS Policies for Profiles
CREATE POLICY "Users can view profiles in their school" ON public.profiles
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- RLS Policies for Classes
CREATE POLICY "Users can view classes in their school" ON public.classes
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- RLS Policies for Streams
CREATE POLICY "Users can view streams in their school" ON public.streams
  FOR SELECT USING (
    class_id IN (
      SELECT id FROM public.classes WHERE school_id IN (
        SELECT school_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage streams" ON public.streams
  FOR ALL USING (
    class_id IN (
      SELECT id FROM public.classes WHERE school_id IN (
        SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
      )
    )
  );

-- RLS Policies for Students
CREATE POLICY "Users can view students in their school" ON public.students
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- RLS Policies for Subjects
CREATE POLICY "Users can view subjects in their school" ON public.subjects
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- RLS Policies for Teachers
CREATE POLICY "Users can view teachers in their school" ON public.teachers
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage teachers" ON public.teachers
  FOR ALL USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- RLS Policies for Teacher Subjects
CREATE POLICY "Users can view teacher subjects in their school" ON public.teacher_subjects
  FOR SELECT USING (
    teacher_id IN (
      SELECT id FROM public.teachers WHERE school_id IN (
        SELECT school_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage teacher subjects" ON public.teacher_subjects
  FOR ALL USING (
    teacher_id IN (
      SELECT id FROM public.teachers WHERE school_id IN (
        SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
      )
    )
  );

-- RLS Policies for Terms
CREATE POLICY "Users can view terms in their school" ON public.terms
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage terms" ON public.terms
  FOR ALL USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- RLS Policies for Examinations
CREATE POLICY "Users can view examinations in their school" ON public.examinations
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage examinations" ON public.examinations
  FOR ALL USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- RLS Policies for Results
CREATE POLICY "Users can view results in their school" ON public.results
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM public.students WHERE school_id IN (
        SELECT school_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers and admins can manage results" ON public.results
  FOR ALL USING (
    student_id IN (
      SELECT id FROM public.students WHERE school_id IN (
        SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'teacher')
      )
    )
  );

-- RLS Policies for Tests
CREATE POLICY "Users can view tests in their school" ON public.tests
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Teachers and admins can manage tests" ON public.tests
  FOR ALL USING (
    school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'teacher'))
  );

-- RLS Policies for Test Results
CREATE POLICY "Users can view test results in their school" ON public.test_results
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM public.students WHERE school_id IN (
        SELECT school_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers and admins can manage test results" ON public.test_results
  FOR ALL USING (
    student_id IN (
      SELECT id FROM public.students WHERE school_id IN (
        SELECT school_id FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'teacher')
      )
    )
  );
