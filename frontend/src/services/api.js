import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function extractReport(response) {
  const jac = response.data;
  if (jac.ok && jac.data?.reports?.length > 0) {
    return jac.data.reports[0];
  }
  return null;
}

/** Walkers that must not receive a stale session token (only email/password etc.). */
const WALKERS_WITHOUT_AUTO_TOKEN = new Set(['Login', 'Signup']);

function walkerPost(name, body = {}) {
  const token = localStorage.getItem('token');
  const attachToken = token && !WALKERS_WITHOUT_AUTO_TOKEN.has(name);
  const payload = attachToken ? { token, ...body } : body;
  return api.post(`/walker/${name}`, payload).then((res) => {
    const report = extractReport(res);
    if (report) return report;
    const d = res?.data;
    const hint =
      d?.detail ||
      d?.message ||
      (typeof d === 'string' ? d : d && typeof d === 'object' ? JSON.stringify(d).slice(0, 400) : '');
    throw new Error(hint ? `${name} returned no report: ${hint}` : `${name} returned no report`);
  });
}

// Auth
export const signup = (email, password, name) =>
  walkerPost('Signup', { email, password, name });

export const login = (email, password) =>
  walkerPost('Login', { email, password });

export const getMe = (token) =>
  walkerPost('Me', { token });

export const updatePreferences = (token, preferences) =>
  walkerPost('UpdatePreferences', { token, ...preferences });

// Career fair
export const listEvents = () =>
  api.post('/walker/ListEvents', {}).then((r) => r.data);

export const listCompanies = (filters) =>
  walkerPost('ListCompanies', filters).catch(() => []);

export const getCompany = (event_id, company_id) =>
  walkerPost('GetCompany', { event_id, company_id });

export const saveCompany = (token, company_id, event_id) =>
  walkerPost('SaveCompany', { token, company_id, event_id });

export const unsaveCompany = (token, company_id, event_id) =>
  walkerPost('UnsaveCompany', { token, company_id, event_id });

export const listSavedCompanies = (token, event_id) =>
  walkerPost('ListSavedCompanies', { token, event_id }).catch(() => []);

export const generateElevatorPitch = (token, company_id, event_id) =>
  walkerPost('GenerateElevatorPitch', { token, company_id, event_id });

export const rankCompanies = (token, event_id) =>
  walkerPost('RankCompanies', { token, event_id });

export const savePitch = (token, company_id, event_id, pitch) =>
  walkerPost('SavePitch', { token, company_id, event_id, pitch });

// Resume (original)
export const uploadResume = (token, filename, raw_text, pdf_data = '') =>
  walkerPost('ResumeUpload', { token, filename, raw_text, pdf_data });

export const getResume = (token, resume_id) =>
  walkerPost('GetResume', { token, resume_id });

export const listResumes = (token) =>
  walkerPost('ListResumes', { token }).catch(() => ({ resumes: [] }));

export const deleteResume = (token, resume_id) =>
  walkerPost('DeleteResume', { token, resume_id });

// AI Chat
export const chatWithAI = (token, question, history, event_id = 'evt_umich_fall_2025', image_data = '', image_mime_type = '') =>
  walkerPost('ChatWithAI', { token, question, history, event_id, image_data, image_mime_type });

// Resume Telling – Resume Lab
export const rtUploadResume = (opts) => {
  if (opts.file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = reader.result.split(',')[1];
        walkerPost('RTUploadResume', {
          file_name: opts.file.name,
          file_data: b64,
          version_name: opts.version_name || opts.file.name.replace(/\.[^.]+$/, ''),
          label: opts.label || 'general',
          company_tag: opts.company_tag || 'Other',
        }).then(resolve).catch(reject);
      };
      reader.onerror = reject;
      reader.readAsDataURL(opts.file);
    });
  }
  return walkerPost('RTUploadResume', {
    plain_text: opts.plain_text || '',
    version_name: opts.version_name || 'My Resume',
    label: opts.label || 'general',
    company_tag: opts.company_tag || 'Other',
  });
};

export const rtListResumes = () =>
  walkerPost('RTListResumes', {}).catch(() => []);

export const rtGetResume = (resume_id) =>
  walkerPost('RTGetResume', { resume_id });

export const rtDeleteResume = (resume_id) =>
  walkerPost('RTDeleteResume', { resume_id });

export const rtUpdateResumeVersion = (resume_id, { version_name = '', label = '', company_tag = '' } = {}) =>
  walkerPost('RTUpdateResumeVersion', { resume_id, version_name, label, company_tag });

export const rtUpdateResumeParsed = (resume_id, parsed_data) =>
  walkerPost('RTUpdateResumeParsed', { resume_id, parsed_data });

export const rtUpdateSectionOrder = (resume_id, section_order) =>
  walkerPost('RTUpdateSectionOrder', { resume_id, section_order });

export const rtMoveSectionItem = (resume_id, section, index, direction) =>
  walkerPost('RTMoveSectionItem', { resume_id, section, index, direction });

export const rtAdjustBullet = (bullet, direction, prompt) =>
  walkerPost('RTAdjustBullet', { bullet, direction, ...(prompt ? { prompt } : {}) });

export const rtTailorResume = (opts) =>
  walkerPost('RTTailorResume', opts);

export const rtSaveTailoredResume = (opts) =>
  walkerPost('RTSaveTailoredResume', opts);

export const rtMatchSkills = (resume_id, job_description) =>
  walkerPost('RTMatchSkills', { resume_id, job_description });

export const rtGenerateCoverLetter = (opts) =>
  walkerPost('RTGenerateCoverLetter', opts);

export const rtExportResume = (resume_id) =>
  walkerPost('RTExportResume', { resume_id });

// Experiences
export const rtAddExperience = (opts) =>
  walkerPost('RTAddExperience', opts);

export const rtListExperiences = () =>
  walkerPost('RTListExperiences', {}).catch(() => []);

export const rtUpdateExperience = (opts) =>
  walkerPost('RTUpdateExperience', opts);

export const rtDeleteExperience = (exp_id) =>
  walkerPost('RTDeleteExperience', { exp_id });

export const rtImportExperiences = (resume_id) =>
  walkerPost('RTImportExperiences', { resume_id });

// BQ Stories
export const rtBuildStory = (opts) =>
  walkerPost('RTBuildStory', opts);

export const rtListStories = (exp_id) =>
  walkerPost('RTListStories', { exp_id: exp_id || '' }).catch(() => []);

export const rtGetStory = (story_id) =>
  walkerPost('RTGetStory', { story_id });

export const rtUpdateStory = (story_id, title, user_notes) =>
  walkerPost('RTUpdateStory', { story_id, title: title || '', user_notes: user_notes || '' });

export const rtDeleteStory = (story_id) =>
  walkerPost('RTDeleteStory', { story_id });

export const rtRecommendStory = (question) =>
  walkerPost('RTRecommendStory', { question });

export const rtSuggestStoryQuestions = (exp_id, story_seed) =>
  walkerPost('RTSuggestStoryQuestions', { exp_id, story_seed });

export default api;
