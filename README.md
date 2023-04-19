# Open Inference Protocol Specification 

The Open Inference Protocol specification describes the cross machine learning model serving runtime inference requirements and expectations for all implementations.

- The inference REST [specification](./specification/protocol/inference_rest.md)
- The inference gRPC [specification](./specification/protocol/inference_grpc.md)

## Adoptions
- KServe [v2 inference protocol](https://kserve.github.io/website/master/modelserving/data_plane/v2_protocol/)
- NVIDIA [Triton inference server protocol](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/customization_guide/inference_protocols.html)
- Seldon [MLServer v2 inference protocol](https://docs.seldon.io/projects/seldon-core/en/latest/reference/apis/v2-protocol.html)
- OpenVino [RESTful API](https://docs.openvino.ai/latest/ovms_docs_rest_api_kfs.html) and [gRPC API](https://docs.openvino.ai/latest/ovms_docs_grpc_api_kfs.html)
- AMD [Inference Server](https://xilinx.github.io/inference-server/main/kserve.html)
- TorchServe [Inference API](https://github.com/pytorch/serve/tree/master/kubernetes/kserve)

## Versioning the Specification
Changes to the specification are versioned according to Semantic Versioning 2.0 and described in [CHANGELOG.md](CHANGELOG.md). Layout changes are not versioned. Specific implementations of the specification should specify which version they implement.


## License
By contributing to Open Inference Protocol Specification repository, you agree that your contributions will be licensed under its Apache 2.0 License.

