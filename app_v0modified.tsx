// تكوين Firebase
const firebaseConfig = {
  // قم بإضافة تكوين Firebase الخاص بك هنا
  // يمكنك الحصول عليه من لوحة تحكم Firebase
}

// تهيئة Firebase
firebase.initializeApp(firebaseConfig)

const app = Vue.createApp({
  data() {
    return {
      user: null,
      videos: [],
      selectedFiles: [],
      uploadProgress: 0,
    }
  },
  mounted() {
    firebase.auth().onAuthStateChanged((user) => {
      this.user = user
      if (user) {
        this.loadVideos()
      }
    })
  },
  methods: {
    signIn() {
      const provider = new firebase.auth.GoogleAuthProvider()
      firebase.auth().signInWithPopup(provider)
    },
    signOut() {
      firebase.auth().signOut()
    },
    handleFileUpload(event) {
      this.selectedFiles = event.target.files
    },
    async uploadVideos() {
      if (!this.selectedFiles.length) return

      for (const file of this.selectedFiles) {
        const storageRef = firebase.storage().ref(`videos/${this.user.uid}/${file.name}`)
        const uploadTask = storageRef.put(file)

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          },
          (error) => {
            console.error("Error uploading file:", error)
          },
          async () => {
            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL()
            await this.saveVideoMetadata(file.name, downloadURL)
            this.loadVideos()
            this.uploadProgress = 0
          },
        )
      }
    },
    async saveVideoMetadata(name, url) {
      await firebase.firestore().collection("videos").add({
        userId: this.user.uid,
        name: name,
        url: url,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    },
    async loadVideos() {
      const snapshot = await firebase
        .firestore()
        .collection("videos")
        .where("userId", "==", this.user.uid)
        .orderBy("createdAt", "desc")
        .get()

      this.videos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    },
  },
})

app.mount("#app")

