// Frontend CI: installs, lints, type-checks, tests and builds the app, then
// validates the production Docker image builds. Deployment/promotion is a
// separate, explicitly-approved pipeline owned by the backend repo (see
// ERP_System_backend/ops/jenkins/Deploy.Jenkinsfile).
pipeline {
    agent any

    options {
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        IMAGE_TAG = "${env.GIT_COMMIT ?: 'dev'}".take(12)
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint & type-check') {
            steps {
                sh '''
                    npm run lint
                    npm run typecheck
                '''
            }
        }

        stage('Test') {
            steps {
                sh 'npm run test:coverage -- --reporter=junit --outputFile=reports/junit.xml'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'reports/junit.xml'
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build image') {
            options {
                lock resource: 'erp-vps-heavy'
            }
            steps {
                // Validates the Dockerfile builds; not pushed here. The
                // promotion pipeline re-builds from the same commit and
                // pushes only after this job is green.
                sh "docker build -t erp-frontend:${IMAGE_TAG} ."
            }
        }
    }

    post {
        always {
            archiveArtifacts allowEmptyArchive: true, artifacts: 'reports/**, coverage/**'
        }
    }
}
