<?php

defined('AJXP_EXEC') or die( 'Access not allowed');

/**
 * Legacy Flash plugin for upload
 */
class FlexUploadProcessor extends AJXP_Plugin {

	private static $active = false;
	
	public function preProcess($action, &$httpVars, &$fileVars){
		if(isSet($fileVars["Filedata"])){
			self::$active = true;
			AJXP_Logger::debug("Dir before base64", $httpVars);
			$httpVars["dir"] = base64_decode(urldecode($httpVars["dir"]));
			$fileVars["userfile_0"] = $fileVars["Filedata"];
			unset($fileVars["Filedata"]);
			AJXP_Logger::debug("Setting FlexProc active");
		}
	}	
	
	public function postProcess($action, $httpVars, $postProcessData){
		if(!self::$active){
			return false;
		}
		AJXP_Logger::debug("FlexProc is active=".self::$active, $postProcessData);
		$result = $postProcessData["processor_result"];
		if(isSet($result["SUCCESS"]) && $result["SUCCESS"] === true){
			header('HTTP/1.0 200 OK');
			//die("200 OK");
		}else if(isSet($result["ERROR"]) && is_array($result["ERROR"])){
			$code = $result["ERROR"]["CODE"];
			$message = $result["ERROR"]["MESSAGE"];
			
			//header("HTTP/1.0 $code $message");
			die("Error $code $message");
		}
	}	
}
?>
