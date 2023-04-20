## gRPC

The GRPC API closely follows the concepts defined in the
[HTTP/REST](./inference_rest.md) API. A compliant server must implement the
health, metadata, and inference APIs described in this section.


| API  | rpc Endpoint | Request Message | Response Message | 
| --- | --- | --- | ---| 
| Inference | [ModelInfer](#inference) | ModelInferRequest | ModelInferResponse | 
| Model Ready | [ModelReady](#model-ready) | ModelReadyRequest | ModelReadyResponse |
| Model Metadata | [ModelMetadata](#model-metadata)| ModelMetadataRequest | ModelMetadataResponse | 
| Server Ready | [ServerReady](#server-ready) | ServerReadyRequest | ServerReadyResponse |
| Server Live | [ServerLive](#server-live) | ServerLiveRequest | ServerLiveResponse | 

For more detailed information on each endpoint and its contents, see `API Definitions` and `Message Contents`.

See also: The gRPC endpoints, request/response messages and contents are defined in [grpc_predict_v2.proto](./open_inference_grpc.proto)


### **API Definitions**

The GRPC definition of the service is:

    //
    // Inference Server GRPC endpoints.
    //
    service GRPCInferenceService
    {
      // Check liveness of the inference server.
      rpc ServerLive(ServerLiveRequest) returns (ServerLiveResponse) {}

      // Check readiness of the inference server.
      rpc ServerReady(ServerReadyRequest) returns (ServerReadyResponse) {}

      // Check readiness of a model in the inference server.
      rpc ModelReady(ModelReadyRequest) returns (ModelReadyResponse) {}

      // Get server metadata.
      rpc ServerMetadata(ServerMetadataRequest) returns (ServerMetadataResponse) {}

      // Get model metadata.
      rpc ModelMetadata(ModelMetadataRequest) returns (ModelMetadataResponse) {}

      // Perform inference using a specific model.
      rpc ModelInfer(ModelInferRequest) returns (ModelInferResponse) {}
    }

### **Message Contents**

### Health

A health request is made using the ServerLive, ServerReady, or
ModelReady endpoint. For each of these endpoints errors are indicated by the google.rpc.Status returned for the request. The OK code indicates success and other codes indicate failure.

#### Server Live

The ServerLive API indicates if the inference server is able to
receive and respond to metadata and inference requests. The request
and response messages for ServerLive are:

    message ServerLiveRequest {}

    message ServerLiveResponse
    {
      // True if the inference server is live, false if not live.
      bool live = 1;
    }

#### Server Ready

The ServerReady API indicates if the server is ready for
inferencing. The request and response messages for ServerReady are:

    message ServerReadyRequest {}

    message ServerReadyResponse
    {
      // True if the inference server is ready, false if not ready.
      bool ready = 1;
    }

#### Model Ready

The ModelReady API indicates if a specific model is ready for
inferencing. The request and response messages for ModelReady are:

    message ModelReadyRequest
    {
      // The name of the model to check for readiness.
      string name = 1;

      // The version of the model to check for readiness. If not given the
      // server will choose a version based on the model and internal policy.
      string version = 2;
    }

    message ModelReadyResponse
    {
      // True if the model is ready, false if not ready.
      bool ready = 1;
    }

---

### Metadata

#### Server Metadata 

The ServerMetadata API provides information about the server. Errors are indicated by the google.rpc.Status returned for the request. The OK code indicates success and other codes indicate failure. The request and response messages for ServerMetadata are:

    message ServerMetadataRequest {}

    message ServerMetadataResponse
    {
      // The server name.
      string name = 1;

      // The server version.
      string version = 2;

      // The extensions supported by the server.
      repeated string extensions = 3;
    }

#### Model Metadata

The per-model metadata API provides information about a model. Errors
are indicated by the google.rpc.Status returned for the request. The
OK code indicates success and other codes indicate failure. The
request and response messages for ModelMetadata are:

    message ModelMetadataRequest
    {
      // The name of the model.
      string name = 1;

      // The version of the model to check for readiness. If not given the
      // server will choose a version based on the model and internal policy.
      string version = 2;
    }

    message ModelMetadataResponse
    {
      // Metadata for a tensor.
      message TensorMetadata
      {
        // The tensor name.
        string name = 1;

        // The tensor data type.
        string datatype = 2;

        // The tensor shape. A variable-size dimension is represented
        // by a -1 value.
        repeated int64 shape = 3;
      }

      // The model name.
      string name = 1;

      // The versions of the model available on the server.
      repeated string versions = 2;

      // The model's platform. See Platforms.
      string platform = 3;

      // The model's inputs.
      repeated TensorMetadata inputs = 4;

      // The model's outputs.
      repeated TensorMetadata outputs = 5;
    }

#### Platforms

A platform is a string indicating a DL/ML framework or
backend. Platform is returned as part of the response to a
[Model Metadata](#model_metadata) request but is information only. The
proposed inference APIs are generic relative to the DL/ML framework
used by a model and so a client does not need to know the platform of
a given model to use the API. Platform names use the format
“<project>_<format>”. The following platform names are allowed:

* tensorrt_plan : A TensorRT model encoded as a serialized engine or “plan”.
* tensorflow_graphdef : A TensorFlow model encoded as a GraphDef.
* tensorflow_savedmodel : A TensorFlow model encoded as a SavedModel.
* onnx_onnxv1 : A ONNX model encoded for ONNX Runtime.
* pytorch_torchscript : A PyTorch model encoded as TorchScript.
* mxnet_mxnet: An MXNet model
* caffe2_netdef : A Caffe2 model encoded as a NetDef.

---

### Inference

The ModelInfer API performs inference using the specified
model. Errors are indicated by the google.rpc.Status returned for the request. The OK code indicates success and other codes indicate
failure. The request and response messages for ModelInfer are:

    message ModelInferRequest
    {
      // An input tensor for an inference request.
      message InferInputTensor
      {
        // The tensor name.
        string name = 1;

        // The tensor data type.
        string datatype = 2;

        // The tensor shape.
        repeated int64 shape = 3;

        // Optional inference input tensor parameters.
        map<string, InferParameter> parameters = 4;

        // The tensor contents using a data-type format. This field must
        // not be specified if "raw" tensor contents are being used for
        // the inference request.
        InferTensorContents contents = 5;
      }

      // An output tensor requested for an inference request.
      message InferRequestedOutputTensor
      {
        // The tensor name.
        string name = 1;

        // Optional requested output tensor parameters.
        map<string, InferParameter> parameters = 2;
      }

      // The name of the model to use for inferencing.
      string model_name = 1;

      // The version of the model to use for inference. If not given the
      // server will choose a version based on the model and internal policy.
      string model_version = 2;

      // Optional identifier for the request. If specified will be
      // returned in the response.
      string id = 3;

      // Optional inference parameters.
      map<string, InferParameter> parameters = 4;

      // The input tensors for the inference.
      repeated InferInputTensor inputs = 5;

      // The requested output tensors for the inference. Optional, if not
      // specified all outputs produced by the model will be returned.
      repeated InferRequestedOutputTensor outputs = 6;

      // The data contained in an input tensor can be represented in "raw"
      // bytes form or in the repeated type that matches the tensor's data
      // type. To use the raw representation 'raw_input_contents' must be
      // initialized with data for each tensor in the same order as
      // 'inputs'. For each tensor, the size of this content must match
      // what is expected by the tensor's shape and data type. The raw
      // data must be the flattened, one-dimensional, row-major order of
      // the tensor elements without any stride or padding between the
      // elements. Note that the FP16 data type must be represented as raw
      // content as there is no specific data type for a 16-bit float
      // type.
      //
      // If this field is specified then InferInputTensor::contents must
      // not be specified for any input tensor.
      repeated bytes raw_input_contents = 7;
    }

    message ModelInferResponse
    {
      // An output tensor returned for an inference request.
      message InferOutputTensor
      {
        // The tensor name.
        string name = 1;

        // The tensor data type.
        string datatype = 2;

        // The tensor shape.
        repeated int64 shape = 3;

        // Optional output tensor parameters.
        map<string, InferParameter> parameters = 4;

        // The tensor contents using a data-type format. This field must
        // not be specified if "raw" tensor contents are being used for
        // the inference response.
        InferTensorContents contents = 5;
      }

      // The name of the model used for inference.
      string model_name = 1;

      // The version of the model used for inference.
      string model_version = 2;

      // The id of the inference request if one was specified.
      string id = 3;

      // Optional inference response parameters.
      map<string, InferParameter> parameters = 4;

      // The output tensors holding inference results.
      repeated InferOutputTensor outputs = 5;

      // The data contained in an output tensor can be represented in
      // "raw" bytes form or in the repeated type that matches the
      // tensor's data type. To use the raw representation 'raw_output_contents'
      // must be initialized with data for each tensor in the same order as
      // 'outputs'. For each tensor, the size of this content must match
      // what is expected by the tensor's shape and data type. The raw
      // data must be the flattened, one-dimensional, row-major order of
      // the tensor elements without any stride or padding between the
      // elements. Note that the FP16 data type must be represented as raw
      // content as there is no specific data type for a 16-bit float
      // type.
      //
      // If this field is specified then InferOutputTensor::contents must
      // not be specified for any output tensor.
      repeated bytes raw_output_contents = 6;
    }

#### Parameters

The Parameters message describes a “name”/”value” pair, where the
“name” is the name of the parameter and the “value” is a boolean,
integer, or string corresponding to the parameter.

Currently, no parameters are defined. As required a future proposal may define one or more standard parameters to allow portable functionality across different inference servers. A server can implement server-specific parameters to provide non-standard capabilities.

    //
    // An inference parameter value.
    //
    message InferParameter
    {
      // The parameter value can be a string, an int64, a boolean
      // or a message specific to a predefined parameter.
      oneof parameter_choice
      {
        // A boolean parameter value.
        bool bool_param = 1;

        // An int64 parameter value.
        int64 int64_param = 2;

        // A string parameter value.
        string string_param = 3;
      }
    }

---

### Tensor Data

In all representations tensor data must be flattened to a
one-dimensional, row-major order of the tensor elements. Element
values must be given in "linear" order without any stride or padding
between elements.

Using a "raw" representation of tensors with
ModelInferRequest::raw_input_contents and
ModelInferResponse::raw_output_contents will typically allow higher
performance due to the way protobuf allocation and reuse interacts
with GRPC. For example, see https://github.com/grpc/grpc/issues/23231.

An alternative to the "raw" representation is to use
InferTensorContents to represent the tensor data in a format that
matches the tensor's data type.

    //
    // The data contained in a tensor represented by the repeated type
    // that matches the tensor's data type. Protobuf oneof is not used
    // because oneofs cannot contain repeated fields.
    //
    message InferTensorContents
    {
      // Representation for BOOL data type. The size must match what is
      // expected by the tensor's shape. The contents must be the flattened,
      // one-dimensional, row-major order of the tensor elements.
      repeated bool bool_contents = 1;

      // Representation for INT8, INT16, and INT32 data types. The size
      // must match what is expected by the tensor's shape. The contents
      // must be the flattened, one-dimensional, row-major order of the
      // tensor elements.
      repeated int32 int_contents = 2;

      // Representation for INT64 data types. The size must match what
      // is expected by the tensor's shape. The contents must be the
      // flattened, one-dimensional, row-major order of the tensor elements.
      repeated int64 int64_contents = 3;

      // Representation for UINT8, UINT16, and UINT32 data types. The size
      // must match what is expected by the tensor's shape. The contents
      // must be the flattened, one-dimensional, row-major order of the
      // tensor elements.
      repeated uint32 uint_contents = 4;

      // Representation for UINT64 data types. The size must match what
      // is expected by the tensor's shape. The contents must be the
      // flattened, one-dimensional, row-major order of the tensor elements.
      repeated uint64 uint64_contents = 5;

      // Representation for FP32 data type. The size must match what is
      // expected by the tensor's shape. The contents must be the flattened,
      // one-dimensional, row-major order of the tensor elements.
      repeated float fp32_contents = 6;

      // Representation for FP64 data type. The size must match what is
      // expected by the tensor's shape. The contents must be the flattened,
      // one-dimensional, row-major order of the tensor elements.
      repeated double fp64_contents = 7;

      // Representation for BYTES data type. The size must match what is
      // expected by the tensor's shape. The contents must be the flattened,
      // one-dimensional, row-major order of the tensor elements.
      repeated bytes bytes_contents = 8;
    }

#### Tensor Data Types

Tensor data types are shown in the following table along with the size
of each type, in bytes.


| Data Type | Size (bytes) |
| --------- | ------------ |
| BOOL      | 1            |
| UINT8     | 1            |
| UINT16    | 2            |
| UINT32    | 4            |
| UINT64    | 8            |
| INT8      | 1            |
| INT16     | 2            |
| INT32     | 4            |
| INT64     | 8            |
| FP16      | 2            |
| FP32      | 4            |
| FP64      | 8            |
| BYTES     | Variable (max 2<sup>32</sup>) |

---
