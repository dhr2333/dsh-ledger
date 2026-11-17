#!/usr/bin/env groovy

// dsh-ledger-domain CI — validates the display-only bundle in a throwaway Node
// container. The Python core has its own repository and CI; this job never
// provisions an engine or touches a ledger.

pipeline {
    agent any

    options {
        timeout(time: 15, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                sh '''
                    git log -1 --oneline
                    git status --short
                '''
            }
        }

        stage('Bundle checks') {
            steps {
                sh '''
                    set -eu
                    tar --exclude=.git --exclude=node_modules -cf - . \
                      | docker run --rm -i node:22-bookworm-slim bash -lc '
                          set -eux
                          mkdir -p /workspace
                          tar -xf - -C /workspace
                          cd /workspace
                          node --version
                          for file in index.js client.js src/options.js src/host/routes.js src/host/engine.js; do
                            node --check "$file"
                          done
                          node scripts/check-bundle.mjs
                        '
                '''
            }
        }
    }

    post {
        success {
            echo '✅ dsh-ledger-domain CI 通过'
        }
        failure {
            echo '❌ dsh-ledger-domain CI 失败，请查看测试日志'
        }
        always {
            cleanWs()
        }
    }
}
