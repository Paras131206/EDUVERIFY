/**
 * uploadState.ts
 * Manages institutional document upload state.
 * Guarantee: ALWAYS starts from zero on site reload / fresh page load.
 * Populates stats ONLY when documents are uploaded in the current session.
 */

let documentUploadedInMemory = false;

export const isDocumentUploaded = (): boolean => {
  return documentUploadedInMemory;
};

export const markDocumentUploaded = (uploaded = true): void => {
  documentUploadedInMemory = uploaded;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (uploaded) {
        window.sessionStorage.setItem('eduverify_document_uploaded', 'true');
      } else {
        window.sessionStorage.removeItem('eduverify_document_uploaded');
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      if (uploaded) {
        window.localStorage.setItem('eduverify_data_uploaded', 'true');
      } else {
        window.localStorage.removeItem('eduverify_data_uploaded');
      }
    }
  } catch {
    // Ignore storage errors in test or restricted environments
  }
};

export const resetUploadStateOnReload = (): void => {
  documentUploadedInMemory = false;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('eduverify_data_uploaded');
    }
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem('eduverify_document_uploaded');
    }
  } catch {
    // Ignore
  }
};
