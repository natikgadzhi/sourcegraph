"""
Load external dependencies for base images
"""

load("@rules_oci//oci:pull.bzl", "oci_pull")

# Quick script to get the latest tags for each of the base images from GCR:
#
# grep 'image = ' ./dev/oci_deps.bzl | while read -r str ; do
#   str_no_spaces="${str#"${str%%[![:space:]]*}"}"  # remove leading spaces
#   url="${str_no_spaces#*\"}"  # remove prefix until first quote
#   url="${url%%\"*}"  # remove suffix from first quote
#
#   IMAGE_DETAILS=$(gcloud container images list-tags $url --limit=1 --sort-by=~timestamp --format=json)
#   TAG=$(echo $IMAGE_DETAILS | jq -r '.[0].tags[0]')
#   DIGEST=$(echo $IMAGE_DETAILS | jq -r '.[0].digest')
#
#   echo $url
#   echo $DIGEST
# done
#
#
# Quick script to get the latest tags for each of the base images from Dockerhub:
# grep 'image = ' ./dev/oci_deps.bzl | while read -r str ; do
#   str_no_spaces="${str#"${str%%[![:space:]]*}"}"  # remove leading spaces
#   url="${str_no_spaces#*\"}"  # remove prefix until first quote
#   url="${url%%\"*}"  # remove suffix from first quote

#     TOKEN=$(curl -s "https://auth.docker.io/token?service=registry.docker.io&scope=repository:${url}:pull" | jq -r .token)

#   DIGEST=$(curl -I -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
#     https://registry-1.docker.io/v2/${url}/manifests/latest \
#     | grep -i Docker-Content-Digest | awk '{print $2}')

#   echo -e "$url\n$DIGEST\n\n"
# done

def oci_deps():
    """
    The image definitions and their digests
    """
    oci_pull(
        name = "wolfi_base",
        digest = "sha256:80e1fb2e9df564905db81e00267201ba227b2244a77d652fbebd9d6f965d20a5",
        image = "index.docker.io/sourcegraph/wolfi-sourcegraph-base",
    )

    oci_pull(
        name = "wolfi_cadvisor_base",
        digest = "sha256:ab4aaa729359dc9ec1a03a9d8b81b020399a7fc1ca8b50f778c86196fb671944",
        image = "index.docker.io/sourcegraph/wolfi-cadvisor-base",
    )

    oci_pull(
        name = "wolfi_symbols_base",
        digest = "sha256:f3693b60794be768040d1dc4891b02730cb36dec0ab31543aa4ee6fd0ed6bfcf",
        image = "index.docker.io/sourcegraph/wolfi-symbols-base",
    )

    oci_pull(
        name = "wolfi_server_base",
        digest = "sha256:220c045550c8b64bf80159d405bf06688fc053fca31adaeb9f871e49ff170fbb",
        image = "index.docker.io/sourcegraph/wolfi-server-base",
    )

    oci_pull(
        name = "wolfi_gitserver_base",
        digest = "sha256:7a86eb4ad59843de3bdcbba5f55215feee76a2531af98103f71afd03a73af23c",
        image = "index.docker.io/sourcegraph/wolfi-gitserver-base",
    )

    oci_pull(
        name = "wolfi_grafana_base",
        digest = "sha256:07a31e9c49300872deeb162910207611261475634bd7bc92e4dcf9a285c98f16",
        image = "us.gcr.io/sourcegraph-dev/wolfi-grafana",
    )

    oci_pull(
        name = "wolfi_postgres_exporter_base",
        digest = "sha256:931ba8cbcedc0dc90d85a11027fd6aa17622145f0fb56c46732364a7fe417985",
        image = "index.docker.io/sourcegraph/wolfi-postgres-exporter-base",
    )

    oci_pull(
        name = "wolfi_jaeger_all_in_one_base",
        digest = "sha256:114fe508d4f375ae9435f75571a03d065c071b385512cfa4e8bb8a383b06e54d",
        image = "index.docker.io/sourcegraph/wolfi-jaeger-all-in-one-base",
    )

    oci_pull(
        name = "wolfi_jaeger_agent_base",
        digest = "sha256:37937ec3a3076023c5a3c4afa4ac6c6031f0954fb645bd9f59c7b8c7d82d73c5",
        image = "index.docker.io/sourcegraph/wolfi-jaeger-agent-base",
    )

    oci_pull(
        name = "wolfi_redis_base",
        digest = "sha256:9046a7abb74370e07a2e928ec36e0a99b83696eac3a2e4e2a3f21c94a37e470f",
        image = "index.docker.io/sourcegraph/wolfi-redis-base",
    )

    oci_pull(
        name = "wolfi_redis_exporter_base",
        digest = "sha256:4d0e01dff9d0fd9f25d49494ea0f83687e592ce7ad9f8df3ff03724077946e8c",
        image = "index.docker.io/sourcegraph/wolfi-redis-exporter-base",
    )

    oci_pull(
        name = "wolfi_syntax_highlighter_base",
        digest = "sha256:b5727d1c8603b4303e6c821dd31770c105ff1ec7ffbd313896994178a02202f5",
        image = "index.docker.io/sourcegraph/wolfi-syntax-highlighter-base",
    )

    oci_pull(
        name = "wolfi_search_indexer_base",
        digest = "sha256:86ac6186d106620c5a4084197ac1d1cfdfafd7227bf99e08825bd3803b39f328",
        image = "index.docker.io/sourcegraph/wolfi-search-indexer-base",
    )

    oci_pull(
        name = "wolfi_repo_updater_base",
        digest = "sha256:0ec165494cdc062017dca9fe0651b5e17e286daa2fc0c5f0dda1ae74e8675f92",
        image = "index.docker.io/sourcegraph/wolfi-repo-updater-base",
    )

    oci_pull(
        name = "wolfi_searcher_base",
        digest = "sha256:3889d6d59cffba38c05eb2c119f82e8a565affc63532adf7680149130c61fff1",
        image = "index.docker.io/sourcegraph/wolfi-searcher-base",
    )

    oci_pull(
        name = "wolfi_executor_base",
        digest = "sha256:f29486c8ff6093450730cffca2d55d99f826d02bea4ada1e0c7c9beeff30ae05",
        image = "index.docker.io/sourcegraph/wolfi-executor-base",
    )

    # ???
    oci_pull(
        name = "wolfi_bundled_executor_base",
        digest = "sha256:4d09d8b1b0d259331854bb4f2d32e2d7beccd757e112b852ee14c7089c945ce9",
        image = "index.docker.io/sourcegraph/wolfi-bundled-executor-base",
    )

    oci_pull(
        name = "wolfi_executor_kubernetes_base",
        digest = "sha256:3bcf1a730c69f6f56c9798d705cd321d72fafecd8018d268bc91b1551404a83d",
        image = "index.docker.io/sourcegraph/wolfi-executor-kubernetes-base",
    )

    oci_pull(
        name = "wolfi_batcheshelper_base",
        digest = "sha256:ee468e4089e5f458085663d9187f7e7c04d787c43e052e017cc1b5b284d55636",
        image = "index.docker.io/sourcegraph/wolfi-batcheshelper-base",
    )

    oci_pull(
        name = "wolfi_prometheus_base",
        digest = "sha256:b910571d4df8b56032e6682b0a5c969312d3d0950497228d2a20ebc390f27502",
        image = "index.docker.io/sourcegraph/wolfi-prometheus-base",
    )

    oci_pull(
        name = "wolfi_prometheus_gcp_base",
        digest = "sha256:ab3829fad1f87b44b6a506c9ddb3183f155639403b1cf59bfff3fb44ca6f3c92",
        image = "index.docker.io/sourcegraph/wolfi-prometheus-gcp-base",
    )

    oci_pull(
        name = "wolfi_postgresql-12_base",
        digest = "sha256:400ef1d1d2037047d40b8a58ab43b6c6f9952151a25b519de12693d4788eaa99",
        image = "index.docker.io/sourcegraph/wolfi-postgresql-12-base",
    )

    oci_pull(
        name = "wolfi_postgresql-12-codeinsights_base",
        digest = "sha256:cd3df2a2e084b921d59ed8b3b3045ad25b955a1bf22c3e0b110ddb2d790105f3",
        image = "index.docker.io/sourcegraph/wolfi-postgresql-12-codeinsights-base",
    )

    oci_pull(
        name = "wolfi_node_exporter_base",
        digest = "sha256:a3a3f6a2c4d0c7a6cd90ad3d8402e16cf5757dde531cb569af4cfddad7f31517",
        image = "index.docker.io/sourcegraph/wolfi-node-exporter-base",
    )

    oci_pull(
        name = "wolfi_opentelemetry_collector_base",
        digest = "sha256:896f2c598a9310d32c9e2e5a020300f827c2d1ba7d7097a9be2460fe1a7b5b38",
        image = "index.docker.io/sourcegraph/wolfi-opentelemetry-collector-base",
    )

    oci_pull(
        name = "wolfi_searcher_base",
        digest = "sha256:3889d6d59cffba38c05eb2c119f82e8a565affc63532adf7680149130c61fff1",
        image = "index.docker.io/sourcegraph/wolfi-searcher-base",
    )

    oci_pull(
        name = "wolfi_s3proxy_base",
        digest = "sha256:32bf3d9068599b5a9a018a069a41c696acde234093374269406f8498e84185c4",
        image = "index.docker.io/sourcegraph/wolfi-blobstore-base",
    )

    oci_pull(
        name = "wolfi_qdrant_base",
        digest = "sha256:1b6e318b3acaf58df2a1883c2ec5d98fddb825d77c78a29bbad67efcff271abd",
        image = "index.docker.io/sourcegraph/wolfi-qdrant-base",
    )
