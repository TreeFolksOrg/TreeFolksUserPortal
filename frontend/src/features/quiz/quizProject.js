const STORAGE_KEY = "preConsultQuizProjectId";

// sessionStorage so a shared device doesn't carry a project id across browser sessions.
export const saveQuizProjectId = (projectId) => {
  sessionStorage.setItem(STORAGE_KEY, projectId);
};

export const getQuizProjectId = () => sessionStorage.getItem(STORAGE_KEY);

export const clearQuizProjectId = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};
