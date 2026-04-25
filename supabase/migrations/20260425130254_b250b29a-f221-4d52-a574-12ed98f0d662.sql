
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'student');
CREATE TYPE public.interview_status AS ENUM ('in_progress', 'completed', 'abandoned');
CREATE TYPE public.question_difficulty AS ENUM ('easy', 'medium', 'hard');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  school TEXT,
  program TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Roles (separate table to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- AI characters
CREATE TABLE public.ai_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  personality TEXT NOT NULL,
  greeting TEXT NOT NULL,
  voice_style TEXT NOT NULL DEFAULT 'neutral',
  avatar_emoji TEXT NOT NULL DEFAULT '🤖',
  accent_color TEXT NOT NULL DEFAULT 'primary',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_characters ENABLE ROW LEVEL SECURITY;

-- Questions
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES public.ai_characters(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  difficulty public.question_difficulty NOT NULL DEFAULT 'medium',
  expected_keywords TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Interviews
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.ai_characters(id) ON DELETE RESTRICT,
  status public.interview_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Responses (per-question answers)
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  question_text TEXT NOT NULL,
  transcript TEXT NOT NULL,
  score INTEGER,
  feedback TEXT,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Results (final per interview)
CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL UNIQUE REFERENCES public.interviews(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  final_score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 75,
  strengths TEXT,
  weaknesses TEXT,
  improvements TEXT,
  overall_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- Profile auto-creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER ai_characters_updated_at BEFORE UPDATE ON public.ai_characters
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ai_characters
CREATE POLICY "Anyone authenticated can view active characters" ON public.ai_characters FOR SELECT TO authenticated USING (is_active = TRUE OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage characters" ON public.ai_characters FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- questions
CREATE POLICY "Auth users view active questions" ON public.questions FOR SELECT TO authenticated USING (is_active = TRUE OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage questions" ON public.questions FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- interviews
CREATE POLICY "Students view own interviews" ON public.interviews FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students create own interviews" ON public.interviews FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students update own interviews" ON public.interviews FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Admins view all interviews" ON public.interviews FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- responses
CREATE POLICY "Students view own responses" ON public.responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_id AND i.student_id = auth.uid())
);
CREATE POLICY "Students insert own responses" ON public.responses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_id AND i.student_id = auth.uid())
);
CREATE POLICY "Students update own responses" ON public.responses FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.interviews i WHERE i.id = interview_id AND i.student_id = auth.uid())
);
CREATE POLICY "Admins view all responses" ON public.responses FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- results
CREATE POLICY "Students view own results" ON public.results FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students insert own results" ON public.results FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Admins view all results" ON public.results FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- ============ SEED AI CHARACTERS ============
INSERT INTO public.ai_characters (name, title, description, personality, greeting, voice_style, avatar_emoji, accent_color) VALUES
('Dr. Santos', 'Academic Interviewer', 'Formal academic interviewer focused on logical and structured thinking.', 'strict, formal, logical, asks probing follow-ups based on academic rigor', 'Good day. I am Dr. Santos. I will be conducting your academic admissions interview today. Please answer each question thoughtfully and with clarity.', 'formal', '🎓', 'primary'),
('Ms. Reyes', 'HR Interviewer', 'Behavioral interviewer evaluating soft skills, motivation, and personality fit.', 'warm, professional, empathetic, asks behavioral and motivation questions', 'Hi there! I am Ms. Reyes. I am excited to get to know you today. We will talk about your motivations, experiences, and how you handle different situations. Take your time with each answer.', 'warm', '💼', 'secondary'),
('Nova', 'AI Adaptive Evaluator', 'Futuristic AI that adapts questions based on your responses.', 'futuristic, curious, adaptive, asks creative scenario-based questions', 'Greetings, candidate. I am Nova, your AI evaluator. My questions will adapt as we go. Speak naturally, and I will analyze your reasoning in real time. Let us begin.', 'futuristic', '🤖', 'accent'),
('Prof. Cruz', 'Technical Evaluator', 'Technical interviewer focused on problem-solving and analytical reasoning.', 'sharp, analytical, focused, asks technical and problem-solving questions', 'Hello. I am Prof. Cruz. Today we will explore your problem-solving abilities. I will give you scenarios and questions that test how you think through challenges. Ready when you are.', 'technical', '🧠', 'primary');

-- ============ SEED QUESTIONS ============
INSERT INTO public.questions (character_id, question_text, category, difficulty, expected_keywords)
SELECT c.id, q.text, q.cat, q.diff::question_difficulty, q.kw FROM public.ai_characters c
CROSS JOIN LATERAL (VALUES
  ('Dr. Santos', 'Tell me about yourself and why you are pursuing this program.', 'introduction', 'easy', ARRAY['background','goals','motivation','program']),
  ('Dr. Santos', 'What academic achievements are you most proud of and why?', 'academics', 'medium', ARRAY['achievement','learning','effort','growth']),
  ('Dr. Santos', 'How do you approach a subject you find difficult?', 'study habits', 'medium', ARRAY['practice','study','help','persistence','strategy']),
  ('Dr. Santos', 'Describe a time you had to think critically about a complex problem.', 'critical thinking', 'hard', ARRAY['analysis','evidence','reasoning','solution']),
  ('Ms. Reyes', 'Tell me about yourself in a few sentences.', 'introduction', 'easy', ARRAY['background','interests','personality']),
  ('Ms. Reyes', 'Describe a challenge you faced and how you overcame it.', 'behavioral', 'medium', ARRAY['challenge','action','result','learn']),
  ('Ms. Reyes', 'How do you handle working under pressure or tight deadlines?', 'behavioral', 'medium', ARRAY['plan','prioritize','focus','manage']),
  ('Ms. Reyes', 'What motivates you to keep going when things get tough?', 'motivation', 'easy', ARRAY['motivation','goal','passion','support']),
  ('Nova', 'If you could solve one global problem, which would it be and how?', 'creative', 'medium', ARRAY['problem','impact','idea','solution','people']),
  ('Nova', 'Imagine you must learn a new skill in 30 days. Walk me through your plan.', 'planning', 'medium', ARRAY['plan','daily','practice','goal','measure']),
  ('Nova', 'Describe a time you changed your mind based on new information.', 'adaptability', 'hard', ARRAY['evidence','open','learn','change','reason']),
  ('Nova', 'How would you explain a complex idea to a curious 10-year-old?', 'communication', 'medium', ARRAY['simple','example','analogy','clear']),
  ('Prof. Cruz', 'Walk me through how you would approach an unfamiliar problem.', 'problem solving', 'medium', ARRAY['understand','break down','steps','test','iterate']),
  ('Prof. Cruz', 'Describe a logical or mathematical concept you find fascinating.', 'technical', 'hard', ARRAY['concept','why','example','application']),
  ('Prof. Cruz', 'How would you debug a system that suddenly stopped working?', 'analytical', 'hard', ARRAY['isolate','test','reproduce','logs','fix']),
  ('Prof. Cruz', 'What is your process for making a difficult decision?', 'reasoning', 'medium', ARRAY['options','tradeoffs','evidence','decide','reflect'])
) AS q(char_name, text, cat, diff, kw)
WHERE c.name = q.char_name;
