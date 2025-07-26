import React, { useMemo } from 'react';

const useSanitizeEditorInput = htmlString => {
  return useMemo(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    return typeof tempDiv.innerText === 'string'
      ? tempDiv.innerText
      : tempDiv.textContent || '';
  }, [htmlString]);
};

export default useSanitizeEditorInput;
