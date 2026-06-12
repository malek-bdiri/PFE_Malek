pipeline {
    agent any

    environment {
        DOCKERHUB_USER    = 'malek1010'
        FRONTEND_IMAGE    = "${DOCKERHUB_USER}/pfe-frontend"
        BACKEND_IMAGE     = "${DOCKERHUB_USER}/pfe-backend"
        PYTHON_RAG_IMAGE  = "${DOCKERHUB_USER}/pfe-python-rag"
        IMAGE_TAG         = "${BUILD_NUMBER}"

        FRONTEND_DIR  = 'ai-software-factory-frontend-dev/ai-software-factory-frontend-dev/ai-software-factory-frontend-dev'
        BACKEND_DIR   = 'ai-software-factory-backend/ai-software-factory-backend'
        PYTHON_DIR    = 'python-rag'
    }

    stages {

        // ─────────────────────────────────────────────
        stage('Checkout') {
        // ─────────────────────────────────────────────
            steps {
                checkout scmGit(
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        credentialsId: 'github_token',
                        url: 'https://github.com/malek-bdiri/PFE_Malek.git'
                    ]]
                )
            }
        }

        // ─────────────────────────────────────────────
        stage('Build') {
        // ─────────────────────────────────────────────
            parallel {

                stage('Build Frontend') {
                    steps {
                        dir("${FRONTEND_DIR}") {
                            sh """
                                docker build \
                                    -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                                    -t ${FRONTEND_IMAGE}:latest \
                                    .
                            """
                        }
                    }
                }

                stage('Build Backend') {
                    steps {
                        dir("${BACKEND_DIR}") {
                            sh """
                                docker build \
                                    -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                                    -t ${BACKEND_IMAGE}:latest \
                                    .
                            """
                        }
                    }
                }

                stage('Build Python RAG') {
                    steps {
                        dir("${PYTHON_DIR}") {
                            sh """
                                docker build \
                                    -t ${PYTHON_RAG_IMAGE}:${IMAGE_TAG} \
                                    -t ${PYTHON_RAG_IMAGE}:latest \
                                    .
                            """
                        }
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        stage('Deploy') {
        // ─────────────────────────────────────────────
            steps {
                withCredentials([usernamePassword(
                        credentialsId: 'dockerhub_token',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS')]) {
                    sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"

                    retry(3) { sh "docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}" }
                    retry(3) { sh "docker push ${FRONTEND_IMAGE}:latest" }

                    retry(3) { sh "docker push ${BACKEND_IMAGE}:${IMAGE_TAG}" }
                    retry(3) { sh "docker push ${BACKEND_IMAGE}:latest" }

                    retry(3) { sh "docker push ${PYTHON_RAG_IMAGE}:${IMAGE_TAG}" }
                    retry(3) { sh "docker push ${PYTHON_RAG_IMAGE}:latest" }
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
        }
        success {
            echo "Pipeline terminé avec succès — images poussées sur DockerHub avec le tag ${IMAGE_TAG}"
        }
        failure {
            echo "Pipeline échoué — vérifier les logs ci-dessus"
        }
    }
}
