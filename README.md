# Open Inference Protocol Specification 

The Open Inference Protocol(OIP) specification defines a standard protocol for performing machine learning model inference across
serving runtimes for different ML frameworks. The protocol facilitates the implementation of a standardized and high performance data plane,
promoting interoperability among model serving runtimes. The specification enables the creation of cohesive inference experience, 
empowering the development of versatile client or benchmarking tools that can work with all
supported serving runtimes.

- The inference REST [specification](./specification/protocol/inference_rest.md)
- The inference gRPC [specification](./specification/protocol/inference_grpc.md)

## Adoptions
- KServe [v2 inference protocol](https://kserve.github.io/website/master/modelserving/data_plane/v2_protocol/)
- NVIDIA [Triton inference server protocol](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/customization_guide/inference_protocols.html)
- Seldon [MLServer](https://mlserver.readthedocs.io/en/stable/user-guide/content-type.html)
- Seldon Core [v2 inference protocol](https://docs.seldon.io/projects/seldon-core/en/v2/contents/getting-started/#api-for-inference)
- OpenVino [RESTful API](https://docs.openvino.ai/latest/ovms_docs_rest_api_kfs.html) and [gRPC API](https://docs.openvino.ai/latest/ovms_docs_grpc_api_kfs.html)
- AMD [Inference Server](https://xilinx.github.io/inference-server/main/kserve.html)
- TorchServe [Inference API](https://github.com/pytorch/serve/tree/master/kubernetes/kserve)

## Versioning the Specification
Changes to the specification are versioned according to Semantic Versioning 2.0 and described in [CHANGELOG.md](CHANGELOG.md). Layout changes are not versioned. Specific implementations of the specification should specify which version they implement.

## Community meeting
We have a public monthly community meeting on Wed 10AM US/Pacific. Please [map that to your local time](https://www.google.com/search?q=1000+am+in+pst&hl=en).

You can also find these meetings [on the community calendar](https://zoom-lfx.platform.linuxfoundation.org/meetings/kserve?view=month), along with other major community events. 

You can find the meeting minutes from the monthly work group sessions in this [Google Doc](https://docs.google.com/document/d/1f21bja1ejHPrZRmY5ke0UxKVD26j0VntJxx0qGN3fKE).

You can access the meeting recordings on [the community calendar](https://zoom-lfx.platform.linuxfoundation.org/meetings/kserve?view=month) by clicking on the respective date's event details.

## License
By contributing to Open Inference Protocol Specification repository, you agree that your contributions will be licensed under its Apache 2.0 License.
