/* eslint-disable */
/**
 * This file was automatically generated by @algorandfoundation/algokit-client-generator.
 * DO NOT MODIFY IT BY HAND.
 * requires: @algorandfoundation/algokit-utils: ^2
 */
import * as algokit from '@algorandfoundation/algokit-utils'
import {
  AppCallTransactionResult,
  AppCallTransactionResultOfType,
  CoreAppCallArgs,
  RawAppCallArgs,
  AppState,
  TealTemplateParams,
  ABIAppCallArg,
} from '@algorandfoundation/algokit-utils/types/app'
import {
  AppClientCallCoreParams,
  AppClientCompilationParams,
  AppClientDeployCoreParams,
  AppDetails,
  ApplicationClient,
} from '@algorandfoundation/algokit-utils/types/app-client'
import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import { SendTransactionResult, TransactionToSign, SendTransactionFrom } from '@algorandfoundation/algokit-utils/types/transaction'
import { Algodv2, OnApplicationComplete, Transaction, TransactionWithSigner, AtomicTransactionComposer } from 'algosdk'
export const APP_SPEC: AppSpec = {
  "hints": {
    "updateAssetMBR(asset)void": {
      "call_config": {
        "no_op": "CALL"
      }
    },
    "setSignature(byte[64],pay)void": {
      "call_config": {
        "no_op": "CALL"
      }
    },
    "delegatedOptIn(pay,axfer)void": {
      "call_config": {
        "no_op": "CALL"
      }
    },
    "unsetSignature()void": {
      "call_config": {
        "no_op": "CALL"
      }
    }
  },
  "bare_call_config": {
    "no_op": "CREATE",
    "opt_in": "NEVER",
    "close_out": "NEVER",
    "update_application": "NEVER",
    "delete_application": "NEVER"
  },
  "schema": {
    "local": {
      "declared": {},
      "reserved": {}
    },
    "global": {
      "declared": {
        "assetMBR": {
          "type": "uint64",
          "key": "assetMBR"
        }
      },
      "reserved": {}
    }
  },
  "state": {
    "global": {
      "num_byte_slices": 0,
      "num_uints": 1
    },
    "local": {
      "num_byte_slices": 0,
      "num_uints": 0
    }
  },
  "source": {
    "approval": "I3ByYWdtYSB2ZXJzaW9uIDkKCnR4biBBcHBsaWNhdGlvbklECmludCAwCj4KaW50IDYKKgp0eG4gT25Db21wbGV0aW9uCisKc3dpdGNoIGNyZWF0ZV9Ob09wIE5PVF9JTVBMRU1FTlRFRCBOT1RfSU1QTEVNRU5URUQgTk9UX0lNUExFTUVOVEVEIE5PVF9JTVBMRU1FTlRFRCBOT1RfSU1QTEVNRU5URUQgY2FsbF9Ob09wCgpOT1RfSU1QTEVNRU5URUQ6CgllcnIKCmFiaV9yb3V0ZV9jcmVhdGVBcHBsaWNhdGlvbjoKCS8vIG5vIGR1cG4gbmVlZGVkCgljYWxsc3ViIGNyZWF0ZUFwcGxpY2F0aW9uCglpbnQgMQoJcmV0dXJuCgpjcmVhdGVBcHBsaWNhdGlvbjoKCXByb3RvIDAgMAoKCS8vIFRPRE86IE9uY2Ugd2UgaGF2ZSBnbG9iYWwgZmllbGQgZm9yIGFzc2V0IE1CUiwgdGhpcyBjYW4gYmUgcmVtb3ZlZAoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjE3CgkvLyB0aGlzLmFzc2V0TUJSLnNldCgxMDBfMDAwKQoJYnl0ZSAiYXNzZXRNQlIiCglpbnQgMTAwXzAwMAoJYXBwX2dsb2JhbF9wdXQKCXJldHN1YgoKYWJpX3JvdXRlX3VwZGF0ZUFzc2V0TUJSOgoJYnl0ZSAweDsgZHVwCgl0eG5hIEFwcGxpY2F0aW9uQXJncyAxCglidG9pCgl0eG5hcyBBc3NldHMKCWNhbGxzdWIgdXBkYXRlQXNzZXRNQlIKCWludCAxCglyZXR1cm4KCnVwZGF0ZUFzc2V0TUJSOgoJcHJvdG8gMyAwCgoJLy8gVE9ETzogUmVwbGFjZSB3aXRoIGdsb2JhbCBmaWVsZCBmb3IgZ2V0dGluZyBhc3NldCBNQlIKCS8vIC4vY29udHJhY3RzL2RlbGVnYXRlZF9vcHRpbl9hcHAuYWxnby50czoyOAoJLy8gcHJlTWJyID0gdGhpcy5hcHAuYWRkcmVzcy5taW5CYWxhbmNlCgl0eG5hIEFwcGxpY2F0aW9ucyAwCglhcHBfcGFyYW1zX2dldCBBcHBBZGRyZXNzCglhc3NlcnQKCWFjY3RfcGFyYW1zX2dldCBBY2N0TWluQmFsYW5jZQoJYXNzZXJ0CglmcmFtZV9idXJ5IC0yIC8vIHByZU1icjogdWludDY0CgoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjMwCgkvLyBzZW5kQXNzZXRUcmFuc2Zlcih7CglpdHhuX2JlZ2luCglpbnQgYXhmZXIKCWl0eG5fZmllbGQgVHlwZUVudW0KCgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6MzEKCS8vIGFzc2V0UmVjZWl2ZXI6IHRoaXMuYXBwLmFkZHJlc3MKCXR4bmEgQXBwbGljYXRpb25zIDAKCWFwcF9wYXJhbXNfZ2V0IEFwcEFkZHJlc3MKCWFzc2VydAoJaXR4bl9maWVsZCBBc3NldFJlY2VpdmVyCgoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjMyCgkvLyB4ZmVyQXNzZXQ6IGFzc2V0CglmcmFtZV9kaWcgLTEgLy8gYXNzZXQ6IGFzc2V0CglpdHhuX2ZpZWxkIFhmZXJBc3NldAoKCS8vIC4vY29udHJhY3RzL2RlbGVnYXRlZF9vcHRpbl9hcHAuYWxnby50czozMwoJLy8gYXNzZXRBbW91bnQ6IDAKCWludCAwCglpdHhuX2ZpZWxkIEFzc2V0QW1vdW50CgoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjM0CgkvLyBmZWU6IDAKCWludCAwCglpdHhuX2ZpZWxkIEZlZQoJaXR4bl9zdWJtaXQKCgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6MzcKCS8vIG1ickRlbHRhID0gcHJlTWJyIC0gdGhpcy5hcHAuYWRkcmVzcy5taW5CYWxhbmNlCglmcmFtZV9kaWcgLTIgLy8gcHJlTWJyOiB1aW50NjQKCXR4bmEgQXBwbGljYXRpb25zIDAKCWFwcF9wYXJhbXNfZ2V0IEFwcEFkZHJlc3MKCWFzc2VydAoJYWNjdF9wYXJhbXNfZ2V0IEFjY3RNaW5CYWxhbmNlCglhc3NlcnQKCS0KCWZyYW1lX2J1cnkgLTMgLy8gbWJyRGVsdGE6IHVpbnQ2NAoKCS8vIC4vY29udHJhY3RzL2RlbGVnYXRlZF9vcHRpbl9hcHAuYWxnby50czozOQoJLy8gYXNzZXJ0KG1ickRlbHRhICE9PSB0aGlzLmFzc2V0TUJSLmdldCgpKQoJZnJhbWVfZGlnIC0zIC8vIG1ickRlbHRhOiB1aW50NjQKCWJ5dGUgImFzc2V0TUJSIgoJYXBwX2dsb2JhbF9nZXQKCSE9Cglhc3NlcnQKCgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6NDAKCS8vIHRoaXMuYXNzZXRNQlIuc2V0KG1ickRlbHRhKQoJYnl0ZSAiYXNzZXRNQlIiCglmcmFtZV9kaWcgLTMgLy8gbWJyRGVsdGE6IHVpbnQ2NAoJYXBwX2dsb2JhbF9wdXQKCgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6NDIKCS8vIHNlbmRBc3NldFRyYW5zZmVyKHsKCWl0eG5fYmVnaW4KCWludCBheGZlcgoJaXR4bl9maWVsZCBUeXBlRW51bQoKCS8vIC4vY29udHJhY3RzL2RlbGVnYXRlZF9vcHRpbl9hcHAuYWxnby50czo0MwoJLy8gYXNzZXRSZWNlaXZlcjogdGhpcy5hcHAuYWRkcmVzcwoJdHhuYSBBcHBsaWNhdGlvbnMgMAoJYXBwX3BhcmFtc19nZXQgQXBwQWRkcmVzcwoJYXNzZXJ0CglpdHhuX2ZpZWxkIEFzc2V0UmVjZWl2ZXIKCgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6NDQKCS8vIHhmZXJBc3NldDogYXNzZXQKCWZyYW1lX2RpZyAtMSAvLyBhc3NldDogYXNzZXQKCWl0eG5fZmllbGQgWGZlckFzc2V0CgoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjQ1CgkvLyBhc3NldEFtb3VudDogMAoJaW50IDAKCWl0eG5fZmllbGQgQXNzZXRBbW91bnQKCgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6NDYKCS8vIGZlZTogMAoJaW50IDAKCWl0eG5fZmllbGQgRmVlCgoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjQ3CgkvLyBhc3NldENsb3NlVG86IHRoaXMuYXBwLmFkZHJlc3MKCXR4bmEgQXBwbGljYXRpb25zIDAKCWFwcF9wYXJhbXNfZ2V0IEFwcEFkZHJlc3MKCWFzc2VydAoJaXR4bl9maWVsZCBBc3NldENsb3NlVG8KCWl0eG5fc3VibWl0CglyZXRzdWIKCmFiaV9yb3V0ZV9zZXRTaWduYXR1cmU6CglieXRlIDB4OyBkdXAKCXR4biBHcm91cEluZGV4CglpbnQgMQoJLQoJdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMQoJY2FsbHN1YiBzZXRTaWduYXR1cmUKCWludCAxCglyZXR1cm4KCnNldFNpZ25hdHVyZToKCXByb3RvIDQgMAoKCS8vIENhbGN1bGF0ZSB0aGUgYXV0aCBhZGRyZXNzIGZvciB0aGUgc2VuZGVyCgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6NjAKCS8vIGF1dGhBZGRyID0gdGhpcy50eG4uc2VuZGVyLmF1dGhBZGRyCgl0eG4gU2VuZGVyCglhY2N0X3BhcmFtc19nZXQgQWNjdEF1dGhBZGRyCglhc3NlcnQKCWZyYW1lX2J1cnkgLTMgLy8gYXV0aEFkZHI6IGFkZHJlc3MKCgkvLyBpZjBfY29uZGl0aW9uCgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6NjEKCS8vIGF1dGhBZGRyID09PSBnbG9iYWxzLnplcm9BZGRyZXNzCglmcmFtZV9kaWcgLTMgLy8gYXV0aEFkZHI6IGFkZHJlc3MKCWdsb2JhbCBaZXJvQWRkcmVzcwoJPT0KCWJ6IGlmMF9lbmQKCgkvLyBpZjBfY29uc2VxdWVudAoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjYxCgkvLyBhdXRoQWRkciA9IHRoaXMudHhuLnNlbmRlcgoJdHhuIFNlbmRlcgoJZnJhbWVfYnVyeSAtMyAvLyBhdXRoQWRkcjogYWRkcmVzcwoKaWYwX2VuZDoKCS8vIFJlY29yZCBNQlIgYmVmb3JlIGJveF9wdXQgdG8gbGF0ZXIgZGV0ZXJtaW5lIHRoZSBNQlIgZGVsdGEKCS8vIC4vY29udHJhY3RzL2RlbGVnYXRlZF9vcHRpbl9hcHAuYWxnby50czo2NAoJLy8gcHJlTUJSID0gdGhpcy5hcHAuYWRkcmVzcy5taW5CYWxhbmNlCgl0eG5hIEFwcGxpY2F0aW9ucyAwCglhcHBfcGFyYW1zX2dldCBBcHBBZGRyZXNzCglhc3NlcnQKCWFjY3RfcGFyYW1zX2dldCBBY2N0TWluQmFsYW5jZQoJYXNzZXJ0CglmcmFtZV9idXJ5IC00IC8vIHByZU1CUjogdWludDY0CgoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjY1CgkvLyB0aGlzLnNpZ25hdHVyZXMuc2V0KGF1dGhBZGRyLCBzaWcpCglmcmFtZV9kaWcgLTMgLy8gYXV0aEFkZHI6IGFkZHJlc3MKCWZyYW1lX2RpZyAtMSAvLyBzaWc6IGJ5dGVbNjRdCglib3hfcHV0CgoJLy8gVmVyaWZ5IGJveCBNQlIgcGF5bWVudAoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjY4CgkvLyBhc3NlcnQoYm94TUJSUGF5bWVudC5yZWNlaXZlciA9PT0gdGhpcy5hcHAuYWRkcmVzcykKCWZyYW1lX2RpZyAtMiAvLyBib3hNQlJQYXltZW50OiBwYXkKCWd0eG5zIFJlY2VpdmVyCgl0eG5hIEFwcGxpY2F0aW9ucyAwCglhcHBfcGFyYW1zX2dldCBBcHBBZGRyZXNzCglhc3NlcnQKCT09Cglhc3NlcnQKCgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6NjkKCS8vIGFzc2VydChib3hNQlJQYXltZW50LmFtb3VudCA+PSB0aGlzLmFwcC5hZGRyZXNzLm1pbkJhbGFuY2UgLSBwcmVNQlIpCglmcmFtZV9kaWcgLTIgLy8gYm94TUJSUGF5bWVudDogcGF5CglndHhucyBBbW91bnQKCXR4bmEgQXBwbGljYXRpb25zIDAKCWFwcF9wYXJhbXNfZ2V0IEFwcEFkZHJlc3MKCWFzc2VydAoJYWNjdF9wYXJhbXNfZ2V0IEFjY3RNaW5CYWxhbmNlCglhc3NlcnQKCWZyYW1lX2RpZyAtNCAvLyBwcmVNQlI6IHVpbnQ2NAoJLQoJPj0KCWFzc2VydAoJcmV0c3ViCgphYmlfcm91dGVfZGVsZWdhdGVkT3B0SW46CgkvLyBubyBkdXBuIG5lZWRlZAoJdHhuIEdyb3VwSW5kZXgKCWludCAxCgktCgl0eG4gR3JvdXBJbmRleAoJaW50IDIKCS0KCWNhbGxzdWIgZGVsZWdhdGVkT3B0SW4KCWludCAxCglyZXR1cm4KCmRlbGVnYXRlZE9wdEluOgoJcHJvdG8gMiAwCgoJLy8gVmVyaWZ5IGFzc2V0IG1iciBwYXltZW50CgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6ODEKCS8vIGFzc2VydChvcHRJbi5hc3NldFJlY2VpdmVyID09PSBtYnJQYXltZW50LnJlY2VpdmVyKQoJZnJhbWVfZGlnIC0yIC8vIG9wdEluOiBheGZlcgoJZ3R4bnMgQXNzZXRSZWNlaXZlcgoJZnJhbWVfZGlnIC0xIC8vIG1iclBheW1lbnQ6IHBheQoJZ3R4bnMgUmVjZWl2ZXIKCT09Cglhc3NlcnQKCgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6ODIKCS8vIGFzc2VydChtYnJQYXltZW50LmFtb3VudCA+PSB0aGlzLmFzc2V0TUJSLmdldCgpKQoJZnJhbWVfZGlnIC0xIC8vIG1iclBheW1lbnQ6IHBheQoJZ3R4bnMgQW1vdW50CglieXRlICJhc3NldE1CUiIKCWFwcF9nbG9iYWxfZ2V0Cgk+PQoJYXNzZXJ0CgoJLy8gVmVyaWZ5IHRoYXQgdGhlIHNpZ25hdHVyZSBpcyBwcmVzZW50CgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6ODUKCS8vIGFzc2VydCh0aGlzLnNpZ25hdHVyZXMuZXhpc3RzKG9wdEluLnNlbmRlcikpCglmcmFtZV9kaWcgLTIgLy8gb3B0SW46IGF4ZmVyCglndHhucyBTZW5kZXIKCWJveF9sZW4KCXN3YXAKCXBvcAoJYXNzZXJ0CglyZXRzdWIKCmFiaV9yb3V0ZV91bnNldFNpZ25hdHVyZToKCWJ5dGUgMHg7IGR1cAoJY2FsbHN1YiB1bnNldFNpZ25hdHVyZQoJaW50IDEKCXJldHVybgoKdW5zZXRTaWduYXR1cmU6Cglwcm90byAyIDAKCgkvLyBDYWxjdWxhdGUgdGhlIGF1dGggYWRkcmVzcyBmb3IgdGhlIHNlbmRlcgoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjk0CgkvLyBhdXRoQWRkciA9IHRoaXMudHhuLnNlbmRlci5hdXRoQWRkcgoJdHhuIFNlbmRlcgoJYWNjdF9wYXJhbXNfZ2V0IEFjY3RBdXRoQWRkcgoJYXNzZXJ0CglmcmFtZV9idXJ5IC0xIC8vIGF1dGhBZGRyOiBhZGRyZXNzCgoJLy8gaWYxX2NvbmRpdGlvbgoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjk1CgkvLyBhdXRoQWRkciA9PT0gZ2xvYmFscy56ZXJvQWRkcmVzcwoJZnJhbWVfZGlnIC0xIC8vIGF1dGhBZGRyOiBhZGRyZXNzCglnbG9iYWwgWmVyb0FkZHJlc3MKCT09CglieiBpZjFfZW5kCgoJLy8gaWYxX2NvbnNlcXVlbnQKCS8vIC4vY29udHJhY3RzL2RlbGVnYXRlZF9vcHRpbl9hcHAuYWxnby50czo5NQoJLy8gYXV0aEFkZHIgPSB0aGlzLnR4bi5zZW5kZXIKCXR4biBTZW5kZXIKCWZyYW1lX2J1cnkgLTEgLy8gYXV0aEFkZHI6IGFkZHJlc3MKCmlmMV9lbmQ6CgkvLyBSZWNvcmQgTUJSIGJlZm9yZSBib3hfZGVsIHRvIGxhdGVyIGRldGVybWluZSB0aGUgTUJSIGRlbHRhCgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6OTgKCS8vIHByZU1CUiA9IHRoaXMuYXBwLmFkZHJlc3MubWluQmFsYW5jZQoJdHhuYSBBcHBsaWNhdGlvbnMgMAoJYXBwX3BhcmFtc19nZXQgQXBwQWRkcmVzcwoJYXNzZXJ0CglhY2N0X3BhcmFtc19nZXQgQWNjdE1pbkJhbGFuY2UKCWFzc2VydAoJZnJhbWVfYnVyeSAtMiAvLyBwcmVNQlI6IHVpbnQ2NAoKCS8vIC4vY29udHJhY3RzL2RlbGVnYXRlZF9vcHRpbl9hcHAuYWxnby50czo5OQoJLy8gdGhpcy5zaWduYXR1cmVzLmRlbGV0ZShhdXRoQWRkcikKCWZyYW1lX2RpZyAtMSAvLyBhdXRoQWRkcjogYWRkcmVzcwoJYm94X2RlbAoKCS8vIFJldHVybiB0aGUgYm94IE1CUgoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjEwMgoJLy8gc2VuZFBheW1lbnQoewoJaXR4bl9iZWdpbgoJaW50IHBheQoJaXR4bl9maWVsZCBUeXBlRW51bQoKCS8vIC4vY29udHJhY3RzL2RlbGVnYXRlZF9vcHRpbl9hcHAuYWxnby50czoxMDMKCS8vIGZlZTogMAoJaW50IDAKCWl0eG5fZmllbGQgRmVlCgoJLy8gLi9jb250cmFjdHMvZGVsZWdhdGVkX29wdGluX2FwcC5hbGdvLnRzOjEwNAoJLy8gYW1vdW50OiBwcmVNQlIgLSB0aGlzLmFwcC5hZGRyZXNzLm1pbkJhbGFuY2UKCWZyYW1lX2RpZyAtMiAvLyBwcmVNQlI6IHVpbnQ2NAoJdHhuYSBBcHBsaWNhdGlvbnMgMAoJYXBwX3BhcmFtc19nZXQgQXBwQWRkcmVzcwoJYXNzZXJ0CglhY2N0X3BhcmFtc19nZXQgQWNjdE1pbkJhbGFuY2UKCWFzc2VydAoJLQoJaXR4bl9maWVsZCBBbW91bnQKCgkvLyAuL2NvbnRyYWN0cy9kZWxlZ2F0ZWRfb3B0aW5fYXBwLmFsZ28udHM6MTA1CgkvLyByZWNlaXZlcjogdGhpcy50eG4uc2VuZGVyCgl0eG4gU2VuZGVyCglpdHhuX2ZpZWxkIFJlY2VpdmVyCglpdHhuX3N1Ym1pdAoJcmV0c3ViCgpjcmVhdGVfTm9PcDoKCXR4biBOdW1BcHBBcmdzCglzd2l0Y2ggYWJpX3JvdXRlX2NyZWF0ZUFwcGxpY2F0aW9uCgllcnIKCmNhbGxfTm9PcDoKCW1ldGhvZCAidXBkYXRlQXNzZXRNQlIoYXNzZXQpdm9pZCIKCW1ldGhvZCAic2V0U2lnbmF0dXJlKGJ5dGVbNjRdLHBheSl2b2lkIgoJbWV0aG9kICJkZWxlZ2F0ZWRPcHRJbihwYXksYXhmZXIpdm9pZCIKCW1ldGhvZCAidW5zZXRTaWduYXR1cmUoKXZvaWQiCgl0eG5hIEFwcGxpY2F0aW9uQXJncyAwCgltYXRjaCBhYmlfcm91dGVfdXBkYXRlQXNzZXRNQlIgYWJpX3JvdXRlX3NldFNpZ25hdHVyZSBhYmlfcm91dGVfZGVsZWdhdGVkT3B0SW4gYWJpX3JvdXRlX3Vuc2V0U2lnbmF0dXJlCgllcnI=",
    "clear": "I3ByYWdtYSB2ZXJzaW9uIDkKaW50IDE="
  },
  "contract": {
    "name": "DelegatedOptIn",
    "desc": "",
    "methods": [
      {
        "name": "updateAssetMBR",
        "args": [
          {
            "name": "asset",
            "type": "asset",
            "desc": "The asset to opt into and opt out of to determine MBR"
          }
        ],
        "desc": "Updates the asset MBR",
        "returns": {
          "type": "void",
          "desc": ""
        }
      },
      {
        "name": "setSignature",
        "args": [
          {
            "name": "sig",
            "type": "byte[64]",
            "desc": "The signature of the lsig"
          },
          {
            "name": "boxMBRPayment",
            "type": "pay",
            "desc": "Payment to cover the contract MBR for box creation"
          }
        ],
        "desc": "Set the signature of the lsig for the given account",
        "returns": {
          "type": "void",
          "desc": ""
        }
      },
      {
        "name": "delegatedOptIn",
        "args": [
          {
            "name": "mbrPayment",
            "type": "pay",
            "desc": "Payment to the receiver that covers the ASA MBR"
          },
          {
            "name": "optIn",
            "type": "axfer",
            "desc": "The opt in transaction, presumably from the open opt-in lsig"
          }
        ],
        "desc": "Verifies that the opt in is allowed",
        "returns": {
          "type": "void",
          "desc": ""
        }
      },
      {
        "name": "unsetSignature",
        "args": [],
        "desc": "Delete the signature from box storage.This will disable delegated opt-ins and return the box MBR balance",
        "returns": {
          "type": "void",
          "desc": ""
        }
      }
    ]
  }
}

/**
 * Defines an onCompletionAction of 'no_op'
 */
export type OnCompleteNoOp =  { onCompleteAction?: 'no_op' | OnApplicationComplete.NoOpOC }
/**
 * Defines an onCompletionAction of 'opt_in'
 */
export type OnCompleteOptIn =  { onCompleteAction: 'opt_in' | OnApplicationComplete.OptInOC }
/**
 * Defines an onCompletionAction of 'close_out'
 */
export type OnCompleteCloseOut =  { onCompleteAction: 'close_out' | OnApplicationComplete.CloseOutOC }
/**
 * Defines an onCompletionAction of 'delete_application'
 */
export type OnCompleteDelApp =  { onCompleteAction: 'delete_application' | OnApplicationComplete.DeleteApplicationOC }
/**
 * Defines an onCompletionAction of 'update_application'
 */
export type OnCompleteUpdApp =  { onCompleteAction: 'update_application' | OnApplicationComplete.UpdateApplicationOC }
/**
 * A state record containing a single unsigned integer
 */
export type IntegerState = {
  /**
   * Gets the state value as a BigInt 
   */
  asBigInt(): bigint
  /**
   * Gets the state value as a number.
   */
  asNumber(): number
}
/**
 * A state record containing binary data
 */
export type BinaryState = {
  /**
   * Gets the state value as a Uint8Array
   */
  asByteArray(): Uint8Array
  /**
   * Gets the state value as a string
   */
  asString(): string
}

/**
 * Defines the types of available calls and state of the DelegatedOptIn smart contract.
 */
export type DelegatedOptIn = {
  /**
   * Maps method signatures / names to their argument and return types.
   */
  methods:
    & Record<'updateAssetMBR(asset)void' | 'updateAssetMBR', {
      argsObj: {
        /**
         * The asset to opt into and opt out of to determine MBR
         */
        asset: number | bigint
      }
      argsTuple: [asset: number | bigint]
      returns: void
    }>
    & Record<'setSignature(byte[64],pay)void' | 'setSignature', {
      argsObj: {
        /**
         * The signature of the lsig
         */
        sig: Uint8Array
        /**
         * Payment to cover the contract MBR for box creation
         */
        boxMBRPayment: TransactionToSign | Transaction | Promise<SendTransactionResult>
      }
      argsTuple: [sig: Uint8Array, boxMBRPayment: TransactionToSign | Transaction | Promise<SendTransactionResult>]
      returns: void
    }>
    & Record<'delegatedOptIn(pay,axfer)void' | 'delegatedOptIn', {
      argsObj: {
        /**
         * Payment to the receiver that covers the ASA MBR
         */
        mbrPayment: TransactionToSign | Transaction | Promise<SendTransactionResult>
        /**
         * The opt in transaction, presumably from the open opt-in lsig
         */
        optIn: TransactionToSign | Transaction | Promise<SendTransactionResult>
      }
      argsTuple: [mbrPayment: TransactionToSign | Transaction | Promise<SendTransactionResult>, optIn: TransactionToSign | Transaction | Promise<SendTransactionResult>]
      returns: void
    }>
    & Record<'unsetSignature()void' | 'unsetSignature', {
      argsObj: {
      }
      argsTuple: []
      returns: void
    }>
  /**
   * Defines the shape of the global and local state of the application.
   */
  state: {
    global: {
      'assetMBR'?: IntegerState
    }
  }
}
/**
 * Defines the possible abi call signatures
 */
export type DelegatedOptInSig = keyof DelegatedOptIn['methods']
/**
 * Defines an object containing all relevant parameters for a single call to the contract. Where TSignature is undefined, a bare call is made
 */
export type TypedCallParams<TSignature extends DelegatedOptInSig | undefined> = {
  method: TSignature
  methodArgs: TSignature extends undefined ? undefined : Array<ABIAppCallArg | undefined>
} & AppClientCallCoreParams & CoreAppCallArgs
/**
 * Defines the arguments required for a bare call
 */
export type BareCallArgs = Omit<RawAppCallArgs, keyof CoreAppCallArgs>
/**
 * Maps a method signature from the DelegatedOptIn smart contract to the method's arguments in either tuple of struct form
 */
export type MethodArgs<TSignature extends DelegatedOptInSig> = DelegatedOptIn['methods'][TSignature]['argsObj' | 'argsTuple']
/**
 * Maps a method signature from the DelegatedOptIn smart contract to the method's return type
 */
export type MethodReturn<TSignature extends DelegatedOptInSig> = DelegatedOptIn['methods'][TSignature]['returns']

/**
 * A factory for available 'create' calls
 */
export type DelegatedOptInCreateCalls = (typeof DelegatedOptInCallFactory)['create']
/**
 * Defines supported create methods for this smart contract
 */
export type DelegatedOptInCreateCallParams =
  | (TypedCallParams<undefined> & (OnCompleteNoOp))
/**
 * Defines arguments required for the deploy method.
 */
export type DelegatedOptInDeployArgs = {
  deployTimeParams?: TealTemplateParams
  /**
   * A delegate which takes a create call factory and returns the create call params for this smart contract
   */
  createCall?: (callFactory: DelegatedOptInCreateCalls) => DelegatedOptInCreateCallParams
}


/**
 * Exposes methods for constructing all available smart contract calls
 */
export abstract class DelegatedOptInCallFactory {
  /**
   * Gets available create call factories
   */
  static get create() {
    return {
      /**
       * Constructs a create call for the DelegatedOptIn smart contract using a bare call
       *
       * @param params Any parameters for the call
       * @returns A TypedCallParams object for the call
       */
      bare(params: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs & AppClientCompilationParams & (OnCompleteNoOp) = {}) {
        return {
          method: undefined,
          methodArgs: undefined,
          ...params,
        }
      },
    }
  }

  /**
   * Constructs a no op call for the updateAssetMBR(asset)void ABI method
   *
   * Updates the asset MBR
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static updateAssetMbr(args: MethodArgs<'updateAssetMBR(asset)void'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'updateAssetMBR(asset)void' as const,
      methodArgs: Array.isArray(args) ? args : [args.asset],
      ...params,
    }
  }
  /**
   * Constructs a no op call for the setSignature(byte[64],pay)void ABI method
   *
   * Set the signature of the lsig for the given account
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static setSignature(args: MethodArgs<'setSignature(byte[64],pay)void'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'setSignature(byte[64],pay)void' as const,
      methodArgs: Array.isArray(args) ? args : [args.sig, args.boxMBRPayment],
      ...params,
    }
  }
  /**
   * Constructs a no op call for the delegatedOptIn(pay,axfer)void ABI method
   *
   * Verifies that the opt in is allowed
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static delegatedOptIn(args: MethodArgs<'delegatedOptIn(pay,axfer)void'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'delegatedOptIn(pay,axfer)void' as const,
      methodArgs: Array.isArray(args) ? args : [args.mbrPayment, args.optIn],
      ...params,
    }
  }
  /**
   * Constructs a no op call for the unsetSignature()void ABI method
   *
   * Delete the signature from box storage.This will disable delegated opt-ins and return the box MBR balance
   *
   * @param args Any args for the contract call
   * @param params Any additional parameters for the call
   * @returns A TypedCallParams object for the call
   */
  static unsetSignature(args: MethodArgs<'unsetSignature()void'>, params: AppClientCallCoreParams & CoreAppCallArgs) {
    return {
      method: 'unsetSignature()void' as const,
      methodArgs: Array.isArray(args) ? args : [],
      ...params,
    }
  }
}

/**
 * A client to make calls to the DelegatedOptIn smart contract
 */
export class DelegatedOptInClient {
  /**
   * The underlying `ApplicationClient` for when you want to have more flexibility
   */
  public readonly appClient: ApplicationClient

  private readonly sender: SendTransactionFrom | undefined

  /**
   * Creates a new instance of `DelegatedOptInClient`
   *
   * @param appDetails appDetails The details to identify the app to deploy
   * @param algod An algod client instance
   */
  constructor(appDetails: AppDetails, private algod: Algodv2) {
    this.sender = appDetails.sender
    this.appClient = algokit.getAppClient({
      ...appDetails,
      app: APP_SPEC
    }, algod)
  }

  /**
   * Checks for decode errors on the AppCallTransactionResult and maps the return value to the specified generic type
   *
   * @param result The AppCallTransactionResult to be mapped
   * @param returnValueFormatter An optional delegate to format the return value if required
   * @returns The smart contract response with an updated return value
   */
  protected mapReturnValue<TReturn>(result: AppCallTransactionResult, returnValueFormatter?: (value: any) => TReturn): AppCallTransactionResultOfType<TReturn> {
    if(result.return?.decodeError) {
      throw result.return.decodeError
    }
    const returnValue = result.return?.returnValue !== undefined && returnValueFormatter !== undefined
      ? returnValueFormatter(result.return.returnValue)
      : result.return?.returnValue as TReturn | undefined
      return { ...result, return: returnValue }
  }

  /**
   * Calls the ABI method with the matching signature using an onCompletion code of NO_OP
   *
   * @param typedCallParams An object containing the method signature, args, and any other relevant parameters
   * @param returnValueFormatter An optional delegate which when provided will be used to map non-undefined return values to the target type
   * @returns The result of the smart contract call
   */
  public async call<TSignature extends keyof DelegatedOptIn['methods']>(typedCallParams: TypedCallParams<TSignature>, returnValueFormatter?: (value: any) => MethodReturn<TSignature>) {
    return this.mapReturnValue<MethodReturn<TSignature>>(await this.appClient.call(typedCallParams), returnValueFormatter)
  }

  /**
   * Idempotently deploys the DelegatedOptIn smart contract.
   *
   * @param params The arguments for the contract calls and any additional parameters for the call
   * @returns The deployment result
   */
  public deploy(params: DelegatedOptInDeployArgs & AppClientDeployCoreParams = {}): ReturnType<ApplicationClient['deploy']> {
    const createArgs = params.createCall?.(DelegatedOptInCallFactory.create)
    return this.appClient.deploy({
      ...params,
      createArgs,
      createOnCompleteAction: createArgs?.onCompleteAction,
    })
  }

  /**
   * Gets available create methods
   */
  public get create() {
    const $this = this
    return {
      /**
       * Creates a new instance of the DelegatedOptIn smart contract using a bare call.
       *
       * @param args The arguments for the bare call
       * @returns The create result
       */
      bare(args: BareCallArgs & AppClientCallCoreParams & AppClientCompilationParams & CoreAppCallArgs & (OnCompleteNoOp) = {}): Promise<AppCallTransactionResultOfType<undefined>> {
        return $this.appClient.create(args) as unknown as Promise<AppCallTransactionResultOfType<undefined>>
      },
    }
  }

  /**
   * Makes a clear_state call to an existing instance of the DelegatedOptIn smart contract.
   *
   * @param args The arguments for the bare call
   * @returns The clear_state result
   */
  public clearState(args: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.appClient.clearState(args)
  }

  /**
   * Calls the updateAssetMBR(asset)void ABI method.
   *
   * Updates the asset MBR
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public updateAssetMbr(args: MethodArgs<'updateAssetMBR(asset)void'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(DelegatedOptInCallFactory.updateAssetMbr(args, params))
  }

  /**
   * Calls the setSignature(byte[64],pay)void ABI method.
   *
   * Set the signature of the lsig for the given account
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public setSignature(args: MethodArgs<'setSignature(byte[64],pay)void'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(DelegatedOptInCallFactory.setSignature(args, params))
  }

  /**
   * Calls the delegatedOptIn(pay,axfer)void ABI method.
   *
   * Verifies that the opt in is allowed
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public delegatedOptIn(args: MethodArgs<'delegatedOptIn(pay,axfer)void'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(DelegatedOptInCallFactory.delegatedOptIn(args, params))
  }

  /**
   * Calls the unsetSignature()void ABI method.
   *
   * Delete the signature from box storage.This will disable delegated opt-ins and return the box MBR balance
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The result of the call
   */
  public unsetSignature(args: MethodArgs<'unsetSignature()void'>, params: AppClientCallCoreParams & CoreAppCallArgs = {}) {
    return this.call(DelegatedOptInCallFactory.unsetSignature(args, params))
  }

  /**
   * Extracts a binary state value out of an AppState dictionary
   *
   * @param state The state dictionary containing the state value
   * @param key The key of the state value
   * @returns A BinaryState instance containing the state value, or undefined if the key was not found
   */
  private static getBinaryState(state: AppState, key: string): BinaryState | undefined {
    const value = state[key]
    if (!value) return undefined
    if (!('valueRaw' in value))
      throw new Error(`Failed to parse state value for ${key}; received an int when expected a byte array`)
    return {
      asString(): string {
        return value.value
      },
      asByteArray(): Uint8Array {
        return value.valueRaw
      }
    }
  }

  /**
   * Extracts a integer state value out of an AppState dictionary
   *
   * @param state The state dictionary containing the state value
   * @param key The key of the state value
   * @returns An IntegerState instance containing the state value, or undefined if the key was not found
   */
  private static getIntegerState(state: AppState, key: string): IntegerState | undefined {
    const value = state[key]
    if (!value) return undefined
    if ('valueRaw' in value)
      throw new Error(`Failed to parse state value for ${key}; received a byte array when expected a number`)
    return {
      asBigInt() {
        return typeof value.value === 'bigint' ? value.value : BigInt(value.value)
      },
      asNumber(): number {
        return typeof value.value === 'bigint' ? Number(value.value) : value.value
      },
    }
  }

  /**
   * Returns the smart contract's global state wrapped in a strongly typed accessor with options to format the stored value
   */
  public async getGlobalState(): Promise<DelegatedOptIn['state']['global']> {
    const state = await this.appClient.getGlobalState()
    return {
      get assetMBR() {
        return DelegatedOptInClient.getIntegerState(state, 'assetMBR')
      },
    }
  }

  public compose(): DelegatedOptInComposer {
    const client = this
    const atc = new AtomicTransactionComposer()
    let promiseChain:Promise<unknown> = Promise.resolve()
    const resultMappers: Array<undefined | ((x: any) => any)> = []
    return {
      updateAssetMbr(args: MethodArgs<'updateAssetMBR(asset)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.updateAssetMbr(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      setSignature(args: MethodArgs<'setSignature(byte[64],pay)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.setSignature(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      delegatedOptIn(args: MethodArgs<'delegatedOptIn(pay,axfer)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.delegatedOptIn(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      unsetSignature(args: MethodArgs<'unsetSignature()void'>, params?: AppClientCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.unsetSignature(args, {...params, sendParams: {...params?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      clearState(args?: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs) {
        promiseChain = promiseChain.then(() => client.clearState({...args, sendParams: {...args?.sendParams, skipSending: true, atc}}))
        resultMappers.push(undefined)
        return this
      },
      addTransaction(txn: TransactionWithSigner | TransactionToSign | Transaction | Promise<SendTransactionResult>, defaultSender?: SendTransactionFrom) {
        promiseChain = promiseChain.then(async () => atc.addTransaction(await algokit.getTransactionWithSigner(txn, defaultSender ?? client.sender)))
        return this
      },
      async atc() {
        await promiseChain
        return atc
      },
      async execute() {
        await promiseChain
        const result = await algokit.sendAtomicTransactionComposer({ atc, sendParams: {} }, client.algod)
        return {
          ...result,
          returns: result.returns?.map((val, i) => resultMappers[i] !== undefined ? resultMappers[i]!(val.returnValue) : val.returnValue)
        }
      }
    } as unknown as DelegatedOptInComposer
  }
}
export type DelegatedOptInComposer<TReturns extends [...any[]] = []> = {
  /**
   * Calls the updateAssetMBR(asset)void ABI method.
   *
   * Updates the asset MBR
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  updateAssetMbr(args: MethodArgs<'updateAssetMBR(asset)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs): DelegatedOptInComposer<[...TReturns, MethodReturn<'updateAssetMBR(asset)void'>]>

  /**
   * Calls the setSignature(byte[64],pay)void ABI method.
   *
   * Set the signature of the lsig for the given account
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  setSignature(args: MethodArgs<'setSignature(byte[64],pay)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs): DelegatedOptInComposer<[...TReturns, MethodReturn<'setSignature(byte[64],pay)void'>]>

  /**
   * Calls the delegatedOptIn(pay,axfer)void ABI method.
   *
   * Verifies that the opt in is allowed
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  delegatedOptIn(args: MethodArgs<'delegatedOptIn(pay,axfer)void'>, params?: AppClientCallCoreParams & CoreAppCallArgs): DelegatedOptInComposer<[...TReturns, MethodReturn<'delegatedOptIn(pay,axfer)void'>]>

  /**
   * Calls the unsetSignature()void ABI method.
   *
   * Delete the signature from box storage.This will disable delegated opt-ins and return the box MBR balance
   *
   * @param args The arguments for the contract call
   * @param params Any additional parameters for the call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  unsetSignature(args: MethodArgs<'unsetSignature()void'>, params?: AppClientCallCoreParams & CoreAppCallArgs): DelegatedOptInComposer<[...TReturns, MethodReturn<'unsetSignature()void'>]>

  /**
   * Makes a clear_state call to an existing instance of the DelegatedOptIn smart contract.
   *
   * @param args The arguments for the bare call
   * @returns The typed transaction composer so you can fluently chain multiple calls or call execute to execute all queued up transactions
   */
  clearState(args?: BareCallArgs & AppClientCallCoreParams & CoreAppCallArgs): DelegatedOptInComposer<[...TReturns, undefined]>

  /**
   * Adds a transaction to the composer
   *
   * @param txn One of: A TransactionWithSigner object (returned as is), a TransactionToSign object (signer is obtained from the signer property), a Transaction object (signer is extracted from the defaultSender parameter), an async SendTransactionResult returned by one of algokit utils helpers (signer is obtained from the defaultSender parameter)
   * @param defaultSender The default sender to be used to obtain a signer where the object provided to the transaction parameter does not include a signer.
   */
  addTransaction(txn: TransactionWithSigner | TransactionToSign | Transaction | Promise<SendTransactionResult>, defaultSender?: SendTransactionFrom): DelegatedOptInComposer<TReturns>
  /**
   * Returns the underlying AtomicTransactionComposer instance
   */
  atc(): Promise<AtomicTransactionComposer>
  /**
   * Executes the transaction group and returns an array of results
   */
  execute(): Promise<DelegatedOptInComposerResults<TReturns>>
}
export type DelegatedOptInComposerResults<TReturns extends [...any[]]> = {
  returns: TReturns
  groupId: string
  txIds: string[]
  transactions: Transaction[]
}
