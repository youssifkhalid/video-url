import React, { useState, useEffect } from "react"
import firebase from "firebase/compat/app"
import "firebase/compat/auth"
import "firebase/compat/firestore"
import "firebase/compat/storage"

const firebaseConfig = {
  apiKey: "AIzaSyBdCQLx7Inm7cLU3dnYsWpn048GEmrPYPk",
  authDomain: "video-json-eeece.firebaseapp.com",
  projectId: "video-json-eeece",
  storageBucket: "video-json-eeece.firebasestorage.app",
  messagingSenderId: "329004987",
  appId: "1:329004987:web:2cf6227fca7088532c369e",
  measurementId: "G-Y6S277GER0",
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

export default function VideoUploader() {
  const [user, setUser] = useState(null)
  const [videos, setVideos] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        loadVideos()
      } else {
        setVideos([])
      }
    })
    return () => unsubscribe()
  }, [])

  const signIn = () => {
    const provider = new firebase.auth.GoogleAuthProvider()
    firebase.auth().signInWithPopup(provider)
  }

  const signOut = () => {
    firebase.auth().signOut()
  }

  const handleFileUpload = (event) => {
    setSelectedFiles(Array.from(event.target.files))
  }

  const uploadVideos = async () => {
    if (!selectedFiles.length) return

    for (const file of selectedFiles) {
      const storageRef = firebase.storage().ref(`videos/${user.uid}/${file.name}`)
      const uploadTask = storageRef.put(file)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progress)
        },
        (error) => {
          console.error("Error uploading file:", error)
        },
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL()
          await saveVideoMetadata(file.name, downloadURL)
          loadVideos()
          setUploadProgress(0)
        },
      )
    }
  }

  const saveVideoMetadata = async (name, url) => {
    await firebase.firestore().collection("videos").add({
      userId: user.uid,
      name: name,
      url: url,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    })
  }

  const loadVideos = async () => {
    const snapshot = await firebase
      .firestore()
      .collection("videos")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get()

    setVideos(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
    )
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ""
    const date = timestamp.toDate()
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "full", timeStyle: "short" }).format(date)
  }

  const downloadJSON = () => {
    const jsonData = {
      user: {
        email: user.email,
        uid: user.uid,
      },
      videos: videos.map((video) => ({
        name: video.name,
        url: video.url,
        createdAt: video.createdAt ? video.createdAt.toDate().toISOString() : null,
      })),
    }

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "video_data.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">منصة رفع الفيديوهات المتقدمة</h1>

      {!user ? (
        <div className="mb-6 text-center">
          <button
            onClick={signIn}
            className="bg-green-500 text-white px-6 py-3 rounded-full text-lg hover:bg-green-600 transition duration-300"
          >
            تسجيل الدخول
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <p className="text-lg mb-4">
              مرحبًا، <span className="font-semibold">{user.email}</span>
            </p>
            <button
              onClick={signOut}
              className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition duration-300"
            >
              تسجيل الخروج
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">رفع الفيديوهات</h2>
            <input
              type="file"
              onChange={handleFileUpload}
              accept="video/*"
              multiple
              className="mb-4 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <button
              onClick={uploadVideos}
              className="bg-blue-500 text-white px-6 py-3 rounded-full text-lg hover:bg-blue-600 transition duration-300"
              disabled={!selectedFiles.length}
            >
              رفع الفيديوهات
            </button>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="bg-blue-200 h-4 rounded-full">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-center mt-2 text-lg">جاري الرفع: {uploadProgress.toFixed(1)}%</p>
            </div>
          )}

          {videos.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">الفيديوهات المرفوعة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div key={video.id} className="bg-gray-50 p-4 rounded-lg shadow">
                    <h3 className="font-bold mb-2 text-lg">{video.name}</h3>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline block mb-2"
                    >
                      رابط المشاهدة
                    </a>
                    <p className="text-sm text-gray-600">تاريخ الرفع: {formatDate(video.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={downloadJSON}
              className="bg-purple-500 text-white px-6 py-3 rounded-full text-lg hover:bg-purple-600 transition duration-300"
            >
              تنزيل ملف JSON
            </button>
          </div>
        </>
      )}
    </div>
  )
}

