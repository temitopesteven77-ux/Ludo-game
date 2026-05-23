import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Plus, RefreshCw, ExternalLink, LogOut, 
  CheckCircle, Users, BarChart3, ClipboardList, 
  Sparkles, Trash2, ArrowRight, Loader2, Play 
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, initAuth, logout, getAccessToken } from '../utils/firebase';

interface FormTemplate {
  id: string;
  name: string;
  emoji: string;
  title: string;
  description: string;
  questions: Array<{
    title: string;
    required: boolean;
    type: 'RADIO' | 'TEXT' | 'PARAGRAPH';
    options?: string[];
  }>;
}

const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'experience_survey',
    name: 'Ludo Match Feedback',
    emoji: '🎲',
    title: 'Ludo Sandbox Board - Match Experience Feedback',
    description: 'Tell us how you liked the custom gameplay, sandbox weapons, and turn pacing!',
    questions: [
      {
        title: 'What is your favorite custom sandbox capability?',
        required: true,
        type: 'RADIO',
        options: ['☠️ Instant Kill (Assassination)', '🌪️ Electric Storm Power-Up', '⏱️ Bot Turn Automation', '🔊 3D Dice Rolling']
      },
      {
        title: 'Are the smart bots too challenging?',
        required: true,
        type: 'RADIO',
        options: ['No - perfect difficulty!', 'Yes - too hard!', 'No - too easy!']
      },
      {
        title: 'How would you rate the 3D dice rolling visual feedback?',
        required: true,
        type: 'RADIO',
        options: ['⭐⭐⭐⭐⭐ Brilliant & Smooth', '⭐⭐⭐ Decent & Interactive', '⭐ Needs improvement']
      },
      {
        title: 'Enter your screen name or avatar nickname:',
        required: true,
        type: 'TEXT'
      },
      {
        title: 'Any suggestions or bugs to report?',
        required: false,
        type: 'PARAGRAPH'
      }
    ]
  },
  {
    id: 'tournament_signup',
    name: 'Tournament Register',
    emoji: '🏆',
    title: 'Ludo Sandbox Battle Royale - Tournament Sign-up',
    description: 'Register your interest to join the upcoming multiplayer tournament championship!',
    questions: [
      {
        title: 'Choose your preferred player token color:',
        required: true,
        type: 'RADIO',
        options: ['Red (Assassins)', 'Green (Elves)', 'Yellow (Solar wizards)', 'Blue (Tidal templars)']
      },
      {
        title: 'What is your player experience level?',
        required: true,
        type: 'RADIO',
        options: ['Modern Board Champion', 'Intermediate Player', 'Casual Roller']
      },
      {
        title: 'Do you agree to fair-play guidelines (no bot hacking)?',
        required: true,
        type: 'RADIO',
        options: ['Yes, I agree fully!', 'No, I want to rule using custom scripts!']
      },
      {
        title: 'Enter your screen name / contact identifier:',
        required: true,
        type: 'TEXT'
      }
    ]
  },
  {
    id: 'bug_tracker',
    name: 'Ideas & Bug Tracker',
    emoji: '🛠️',
    title: 'Ludo Sandbox Utility - Bug Tracker & Idea Hub',
    description: 'Submit suggestions directly to help us improve the sandbox features!',
    questions: [
      {
        title: 'Topic Category:',
        required: true,
        type: 'RADIO',
        options: ['Bug Report', 'Feature Request', 'Aesthetic Idea', 'Audio/Sound Proposal']
      },
      {
        title: 'Which component is this feedback for?',
        required: true,
        type: 'RADIO',
        options: ['3D Dice Assembly', 'Character Tokens & Alignment', 'Board Styling / Aesthetic', 'Sandbox Powers & Triggers']
      },
      {
        title: 'Describe the idea/issue in full detail:',
        required: true,
        type: 'PARAGRAPH'
      }
    ]
  }
];

interface SavedForm {
  formId: string;
  title: string;
  responderUri: string;
  templateId: string;
  createdOn: string;
}

export default function GoogleFormsManager() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCreatingForm, setIsCreatingForm] = useState<string | null>(null); // template ID
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');

  // List of created forms stored locally
  const [savedForms, setSavedForms] = useState<SavedForm[]>(() => {
    const local = localStorage.getItem('ludo_google_forms');
    return local ? JSON.parse(local) : [];
  });

  // Selected saved form for responses inspector
  const [inspectFormId, setInspectFormId] = useState<string | null>(null);
  const [inspectLoading, setInspectLoading] = useState<boolean>(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [formResponses, setFormResponses] = useState<any[]>([]);

  // Initialize Auth state
  useEffect(() => {
    const rx = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
        setAuthError(null);
      },
      () => {
        setNeedsAuth(true);
        setUser(null);
        setToken(null);
      }
    );
    return () => rx();
  }, []);

  // Sync saved forms with localStorage
  useEffect(() => {
    localStorage.setItem('ludo_google_forms', JSON.stringify(savedForms));
  }, [savedForms]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Login failed', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
        setAuthError('The Google connection window was closed before signing in. Please try again!');
      } else {
        setAuthError(err?.message || 'Failed to authenticate Google Account.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setAuthError(null);
    } catch (err) {
      console.error('Logout error occurred', err);
    }
  };

  // Google Forms Creator Pipeline
  const createGoogleFormFromTemplate = async (template: FormTemplate) => {
    if (!token) return;
    setIsCreatingForm(template.id);

    try {
      // 1. Create primary blank form with ONLY info.title as required by Forms API
      const formPayload = {
        info: {
          title: template.title
        }
      };

      const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formPayload)
      });

      if (!createRes.ok) {
        const errorText = await createRes.text();
        throw new Error(`Failed to create base form: ${errorText}`);
      }

      const createdForm = await createRes.json();
      const formId = createdForm.formId;
      const responderUri = createdForm.responderUri;

      // 2. Prepare requests array for batchUpdate API
      const requests: any[] = [];

      // Update description via updateFormInfo
      if (template.description) {
        requests.push({
          updateFormInfo: {
            info: {
              description: template.description
            },
            updateMask: 'description'
          }
        });
      }

      // Append questions
      template.questions.forEach((q, idx) => {
        const itemPayload: any = {
          title: q.title,
          questionItem: {
            question: {
              required: q.required
            }
          }
        };

        if (q.type === 'RADIO' && q.options) {
          itemPayload.questionItem.question.choiceQuestion = {
            type: 'RADIO',
            options: q.options.map((option) => ({ value: option }))
          };
        } else if (q.type === 'TEXT') {
          itemPayload.questionItem.question.textQuestion = {
            paragraph: false
          };
        } else if (q.type === 'PARAGRAPH') {
          itemPayload.questionItem.question.textQuestion = {
            paragraph: true
          };
        }

        requests.push({
          createItem: {
            item: itemPayload,
            location: {
              index: idx
            }
          }
        });
      });

      const batchRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });

      if (!batchRes.ok) {
        const errorText = await batchRes.text();
        throw new Error(`Failed to batch populate items: ${errorText}`);
      }

      // Add to our list
      const freshSaved: SavedForm = {
        formId,
        title: template.title,
        responderUri,
        templateId: template.id,
        createdOn: new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      setSavedForms((prev) => [freshSaved, ...prev]);
      setActiveTab('manage');
      setInspectFormId(formId);
      // Fetch data for the new form
      await fetchFormResponsesAndMetadata(formId, token);
    } catch (err: any) {
      console.error(err);
      alert(`Google Forms creation error: ${err.message || err}`);
    } finally {
      setIsCreatingForm(null);
    }
  };

  // Fetch Form details & responses live
  const fetchFormResponsesAndMetadata = async (formId: string, activeToken: string) => {
    setInspectLoading(true);
    setInspectError(null);
    setFormData(null);
    setFormResponses([]);

    try {
      // Fetch metadata
      const metaRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (!metaRes.ok) {
        throw new Error(`Could not load Form parameters (Status: ${metaRes.status}). Verify user permissions.`);
      }
      const metaData = await metaRes.json();
      setFormData(metaData);

      // Fetch responses
      const respRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });

      if (respRes.status === 404) {
        // Form exists but response directory is empty or not initiated
        setFormResponses([]);
      } else if (!respRes.ok) {
        throw new Error(`Could not load Form responses. Status ${respRes.status}`);
      } else {
        const respData = await respRes.json();
        setFormResponses(respData.responses || []);
      }
    } catch (err: any) {
      setInspectError(err.message || 'Error occurred fetching Google Forms status.');
    } finally {
      setInspectLoading(false);
    }
  };

  const handleDeleteSavedFormItem = (formId: string) => {
    if (window.confirm('Dissociate this Google Form from the local Ludo Dashboard? (This will not delete the form from your Google Drive)')) {
      setSavedForms((prev) => prev.filter((item) => item.formId !== formId));
      if (inspectFormId === formId) {
        setInspectFormId(null);
        setFormData(null);
        setFormResponses([]);
      }
    }
  };

  // Helper code to map question responses visually
  const getQuestionTitleMap = () => {
    if (!formData || !formData.items) return {};
    const mapping: Record<string, string> = {};
    formData.items.forEach((item: any) => {
      if (item.questionItem && item.questionItem.question) {
        mapping[item.questionItem.question.questionId] = item.title;
      }
    });
    return mapping;
  };

  // Count distribution for choices in RADIO questions
  const getChoiceDistribution = (questionId: string, options: any[] | undefined) => {
    if (!options) return [];
    const counts: Record<string, number> = {};
    options.forEach((opt: any) => {
      counts[opt.value] = 0;
    });

    formResponses.forEach((resp: any) => {
      const answers = resp.answers || {};
      const answerObj = answers[questionId];
      if (answerObj && answerObj.textAnswers && answerObj.textAnswers.answers) {
        answerObj.textAnswers.answers.forEach((ans: any) => {
          if (counts[ans.value] !== undefined) {
            counts[ans.value] += 1;
          } else {
            // Unlisted option fallback
            counts[ans.value] = (counts[ans.value] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  return (
    <div id="google-forms-integrator" className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800 shadow-xl overflow-hidden">
      
      {/* Dynamic Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-500 fill-amber-500/10" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Google Forms Center
              <span className="text-[9px] bg-green-500/10 text-green-500 font-extrabold uppercase px-1.5 py-0.5 rounded border border-green-500/20 tracking-wider">
                Workspace
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-slate-400">Deploy custom surveys & monitor responses live</p>
          </div>
        </div>

        {user && (
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-350 transition-colors border border-slate-200/40 dark:border-slate-800"
            title="Disconnect Google Account"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        )}
      </div>

      {/* BEFORE AUTH - LOGIN SCREEN */}
      {needsAuth ? (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center mb-4">
            <ClipboardList className="w-7 h-7 text-indigo-500" />
          </div>
          
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            Sign in with Google Required
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-400 max-w-sm leading-relaxed mb-6">
            Connecting Google Workspace allows us to create beautiful Google Forms for match feedback, tournament brackets, and view stats on your Google account.
          </p>

          <button 
            id="gsi-sign-in-btn"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="gsi-material-button w-full sm:w-auto h-11 inline-flex items-center justify-center border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
          >
            <div className="gsi-material-button-content-wrapper flex items-center gap-3">
              <div className="gsi-material-button-icon w-5 h-5 flex items-center justify-center">
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                ) : (
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                )}
              </div>
              <span className="gsi-material-button-contents text-sm font-semibold select-none">
                {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
              </span>
            </div>
          </button>

          {authError && (
            <div className="mt-4 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[11px] font-bold text-center leading-normal max-w-sm">
              ⚠️ {authError}
            </div>
          )}
        </div>
      ) : (
        /* AFTER AUTH - SYSTEM DASHBOARD */
        <div className="space-y-5">
          
          {/* USER INFO PROFILE CARD */}
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-900">
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'Profile'} 
                className="w-10 h-10 rounded-full border border-indigo-400"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 font-extrabold flex items-center justify-center text-sm uppercase">
                {user?.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-none">
                {user?.displayName}
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate mt-1">
                {user?.email}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2.5 py-1 rounded-xl text-[10px] font-mono border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Connected
            </div>
          </div>

          {/* TAB LAYOUTS */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all
                ${activeTab === 'create' 
                  ? 'bg-white dark:bg-slate-850 text-slate-950 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }
              `}
            >
              <Plus className="w-4 h-4" /> Create Templates
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all
                ${activeTab === 'manage' 
                  ? 'bg-white dark:bg-slate-850 text-slate-950 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }
              `}
            >
              <Users className="w-4 h-4" /> Form Manager ({savedForms.length})
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* TAB: CREATE NEW FORMS */}
            {activeTab === 'create' && (
              <motion.div
                key="create-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3.5 text-left"
              >
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  Select a template to automatically deploy a Google Form live in your Google Drive:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {FORM_TEMPLATES.map((tpl) => {
                    const isCreating = isCreatingForm === tpl.id;
                    return (
                      <div 
                        key={tpl.id}
                        className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/40 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-150 dark:border-slate-850 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                      >
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{tpl.emoji}</span> {tpl.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 leading-snug max-w-sm">
                            {tpl.description}
                          </p>
                          <div className="flex gap-2.5 mt-2 flex-wrap">
                            <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded border border-indigo-500/10">
                              {tpl.questions.length} Fields
                            </span>
                            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/10">
                              Live Form Response
                            </span>
                          </div>
                        </div>

                        <button
                          disabled={isCreatingForm !== null}
                          onClick={() => createGoogleFormFromTemplate(tpl)}
                          className={`flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all shrink-0 active:scale-95`}
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deploying...
                            </>
                          ) : (
                            <>
                              Deploy <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* TAB: MANAGE CREATED FORMS */}
            {activeTab === 'manage' && (
              <motion.div
                key="manage-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {savedForms.length === 0 ? (
                  <div className="py-10 text-center border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-2xl">
                    <ClipboardList className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs text-slate-400 font-bold mb-1">No Ludo Forms Created Yet</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                      Go to the template generator tab to instantly build feedback surveys on Google Forms.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-left">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-extrabold text-slate-400 uppercase font-mono tracking-wider">
                        Select a deployed form:
                      </label>
                      <select
                        value={inspectFormId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInspectFormId(val || null);
                          if (val && token) {
                            fetchFormResponsesAndMetadata(val, token);
                          }
                        }}
                        className="w-full text-xs font-semibold p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-indigo-500/40 text-slate-800 dark:text-slate-100"
                      >
                        <option value="">-- Choose Deployed Google Form --</option>
                        {savedForms.map((sf) => (
                          <option key={sf.formId} value={sf.formId}>
                            {sf.title.length > 40 ? sf.title.substring(0, 40) + '...' : sf.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ACTIONS FOR CURRENT SELECTOR */}
                    {inspectFormId && (
                      <div className="space-y-4">
                        {/* Control Box */}
                        {savedForms.find((f) => f.formId === inspectFormId) && (
                          <div className="flex flex-wrap gap-2 justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900 text-xs">
                            <div className="flex gap-2">
                              <a 
                                href={`https://docs.google.com/forms/d/${inspectFormId}/edit`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/25 dark:hover:bg-indigo-950/50 dark:text-indigo-400 font-bold rounded-lg border border-indigo-200/50 dark:border-indigo-900/40"
                              >
                                Edit Form <ExternalLink className="w-3 h-3" />
                              </a>
                              <a 
                                href={savedForms.find((f) => f.formId === inspectFormId)?.responderUri}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-950/25 dark:hover:bg-green-950/50 dark:text-green-400 font-bold rounded-lg border border-green-200/50 dark:border-green-900/40"
                              >
                                Open Live Link <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                onClick={() => token && fetchFormResponsesAndMetadata(inspectFormId, token)}
                                className="p-1.5 rounded-lg bg-slate-105 hover:bg-slate-200 dark:bg-slate-850 hover:text-indigo-600 transition-colors cursor-pointer text-slate-400 border border-slate-200/20"
                                title="Sync Responses"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSavedFormItem(inspectFormId)}
                                className="p-1.5 rounded-lg bg-slate-105 hover:bg-red-900/20 hover:text-red-500 transition-colors cursor-pointer text-slate-400 border border-slate-200/20"
                                title="Clean Local Memory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* LIVE DATA INSPECTOR PANEL */}
                        <div className="border border-slate-150 dark:border-slate-850 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 p-4">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-950 mb-3">
                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1 font-mono">
                              <BarChart3 className="w-3.5 h-3.5" /> Live Submissions
                            </span>
                            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200/30">
                              {formResponses.length} Submissions
                            </span>
                          </div>

                          {inspectLoading && (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                              <span>Contacting Google Forms API...</span>
                            </div>
                          )}

                          {inspectError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] uppercase font-bold text-center leading-normal">
                              {inspectError}
                            </div>
                          )}

                          {!inspectLoading && !inspectError && formData && (
                            <div className="space-y-4">
                              <div className="bg-white/60 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-900">
                                <h5 className="text-[11px] font-bold text-slate-650 dark:text-slate-300 leading-tight">
                                  {formData.info?.title}
                                </h5>
                                <p className="text-[10px] text-slate-400 mt-1 italic">
                                  {formData.info?.description || 'No description provided.'}
                                </p>
                              </div>

                              {formResponses.length === 0 ? (
                                <div className="py-6 text-center text-[11px] text-slate-400">
                                  <span>No current responses. Click <b>"Open Live Link"</b> to answer the questions, then tap refresh!</span>
                                </div>
                              ) : (
                                <div className="space-y-3.5">
                                  {/* Dynamic Summary Cards mapped by Form Questions */}
                                  {formData.items?.map((item: any, idx: number) => {
                                    if (!item.questionItem) return null;
                                    const qId = item.questionItem.question.questionId;
                                    const isChoice = !!item.questionItem.question.choiceQuestion;
                                    const options = item.questionItem.question.choiceQuestion?.options;

                                    return (
                                      <div key={qId} className="space-y-2 text-left">
                                        <h6 className="text-[11px] font-black text-slate-900 dark:text-slate-200">
                                          {idx + 1}. {item.title}
                                        </h6>

                                        {/* OPTION CHARTS OR SUBMISSIONS LIST */}
                                        {isChoice ? (
                                          <div className="bg-white/40 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 space-y-1.5">
                                            {getChoiceDistribution(qId, options).map((itemCount) => {
                                              const percentage = formResponses.length > 0 
                                                ? Math.round((itemCount.value / formResponses.length) * 100) 
                                                : 0;
                                              return (
                                                <div key={itemCount.name} className="space-y-1">
                                                  <div className="flex justify-between text-[10px] text-slate-550 dark:text-slate-450">
                                                    <span className="truncate max-w-[80%]">{itemCount.name}</span>
                                                    <span className="font-mono font-bold">{itemCount.value} ({percentage}%)</span>
                                                  </div>
                                                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                                    <div 
                                                      className="h-full bg-indigo-500 rounded-full transition-all"
                                                      style={{ width: `${percentage}%` }}
                                                    />
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          // Listing individual text answers
                                          <div className="max-h-24 overflow-y-auto space-y-1 pr-1 border border-slate-100 dark:border-slate-900 bg-white/30 dark:bg-slate-950/30 rounded-xl p-2">
                                            {(() => {
                                              const textResponses: string[] = [];
                                              formResponses.forEach((resp: any) => {
                                                const answers = resp.answers || {};
                                                const ansObj = answers[qId];
                                                if (ansObj && ansObj.textAnswers && ansObj.textAnswers.answers) {
                                                  ansObj.textAnswers.answers.forEach((ans: any) => {
                                                    if (ans.value) textResponses.push(ans.value);
                                                  });
                                                }
                                              });

                                              if (textResponses.length === 0) {
                                                return <span className="text-[10px] text-slate-400 italic">No text answers submitted.</span>;
                                              }

                                              return textResponses.map((trText, trIdx) => (
                                                <div 
                                                  key={trIdx} 
                                                  className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100 dark:border-slate-900 text-[10px] text-slate-650 dark:text-slate-300 leading-tight"
                                                >
                                                  • {trText}
                                                </div>
                                              ));
                                            })()}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
