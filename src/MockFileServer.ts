interface FileVersion {
  id: number
  content: string
  timestamp: string
}

class MockFileServer {
  private static versions: FileVersion[] = []
  private static idCounter = 1

  static saveVersion (content: string): void {
    this.versions.push({
      id: this.idCounter++,
      content,
      timestamp: new Date().toISOString()
    })
  }

  static getVersions (): FileVersion[] {
    return [...this.versions]
  }
}

export default MockFileServer
export type { FileVersion }
