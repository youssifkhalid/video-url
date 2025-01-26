const fileInput = document.getElementById("fileInput")
const uploadButton = document.getElementById("uploadButton")
const linkContainer = document.getElementById("linkContainer")

const videoLinks = []

uploadButton.addEventListener("click", () => {
  const files = fileInput.files
  if (files.length === 0) {
    alert("الرجاء اختيار فيديو واحد على الأقل")
    return
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const reader = new FileReader()

    reader.onload = (e) => {
      const videoBlob = new Blob([e.target.result], { type: file.type })
      const videoUrl = URL.createObjectURL(videoBlob)
      const videoLink = {
        name: file.name,
        url: videoUrl,
      }
      videoLinks.push(videoLink)
      displayLink(videoLink)
      saveLinksToJSON()
    }

    reader.readAsArrayBuffer(file)
  }
})

function displayLink(videoLink) {
  const linkElement = document.createElement("p")
  linkElement.innerHTML = `<strong>${videoLink.name}:</strong> <a href="${videoLink.url}" target="_blank">${videoLink.url}</a>`
  linkContainer.appendChild(linkElement)
}

function saveLinksToJSON() {
  const jsonData = JSON.stringify(videoLinks, null, 2)
  const blob = new Blob([jsonData], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const downloadLink = document.createElement("a")
  downloadLink.href = url
  downloadLink.download = "video_links.json"
  downloadLink.textContent = "تحميل ملف JSON"

  linkContainer.appendChild(downloadLink)
}

