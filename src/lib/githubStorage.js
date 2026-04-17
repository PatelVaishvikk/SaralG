export async function uploadToGitHub(fileBuffer, originalFilename) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // format: "username/repo"

  if (!token || !repo) {
    console.warn("GitHub token or repo not configured. Skipping image upload.");
    return null;
  }

  // Generate a unique filename to avoid collisions
  const timestamp = Date.now();
  const ext = originalFilename.split('.').pop() || 'png';
  const fileName = `rsvp-images/${timestamp}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

  // Convert buffer to base64
  const base64Content = fileBuffer.toString('base64');
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${fileName}`;

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
    },
    body: JSON.stringify({
      message: `Upload RSVP image ${originalFilename}`,
      content: base64Content,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("GitHub Upload Error:", data);
    throw new Error(data.message || "Failed to upload image to GitHub");
  }

  // data.content.download_url gives the raw URL
  return data.content.download_url;
}
