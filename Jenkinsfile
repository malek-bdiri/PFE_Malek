pipeline {
    agent any

    environment {
        DOCKER_BUILDKIT   = '1'
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
        stage('Push') {
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

        // ─────────────────────────────────────────────
        stage('Deploy') {
        // ─────────────────────────────────────────────
            steps {
                // Préparer le .env du RAG (credential Jenkins "python_rag_env")
                withCredentials([file(credentialsId: 'python_rag_env', variable: 'RAG_ENV')]) {
                    sh "cp \$RAG_ENV ${PYTHON_DIR}/.env"
                }

                // Arrêter les containers existants et relancer avec les nouvelles images
                sh """
                    docker-compose -f docker-compose.prod.yml down --remove-orphans || true
                    docker-compose -f docker-compose.prod.yml pull
                    docker-compose -f docker-compose.prod.yml up -d
                """

                // Attendre que Keycloak soit prêt puis créer le realm momsoft
                sh '''
                    echo "Attente de Keycloak..."
                    for i in $(seq 1 24); do
                        STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/realms/master 2>/dev/null || echo "000")
                        if [ "$STATUS" = "200" ]; then
                            echo "Keycloak prêt."
                            break
                        fi
                        echo "  tentative $i/24 — statut $STATUS"
                        sleep 10
                    done

                    TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
                        -d "grant_type=password&client_id=admin-cli&username=admin&password=admin" \
                        | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

                    if [ -z "$TOKEN" ]; then
                        echo "Impossible d\'obtenir un token Keycloak — realm non créé."
                        exit 0
                    fi

                    REALM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
                        -H "Authorization: Bearer $TOKEN" \
                        http://localhost:8080/admin/realms/momsoft)

                    if [ "$REALM_STATUS" = "200" ]; then
                        echo "Realm momsoft existe déjà."
                    else
                        curl -s -X POST http://localhost:8080/admin/realms \
                            -H "Authorization: Bearer $TOKEN" \
                            -H "Content-Type: application/json" \
                            -d @keycloak/realm-momsoft.json
                        echo "Realm momsoft créé."
                    fi
                '''
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
        }
        success {
            echo "Pipeline terminé — build ${IMAGE_TAG} déployé sur http://localhost:4200"
        }
        failure {
            echo "Pipeline échoué — vérifier les logs ci-dessus"
        }
    }
}
