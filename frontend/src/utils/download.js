// Read the file name sent by the backend in Content-Disposition
const getFileName = (response, fallback) => {
  const header = response.headers['content-disposition'] || '';
  const match = header.match(/filename="?([^"]+)"?/);
  return match ? match[1] : fallback;
};

export const downloadBlobResponse = (response, fallbackName) => {
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = getFileName(response, fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
