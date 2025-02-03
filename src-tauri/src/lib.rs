// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use bollard::{
    container::{
        Config, CreateContainerOptions, KillContainerOptions, ListContainersOptions, LogsOptions,
        StopContainerOptions,
    },
    image::{ListImagesOptions, RemoveImageOptions},
    Docker,
};
use error::CommandError;
use futures_util::StreamExt;
use payload::{Container, Image};
use tauri::{ipc::Channel, State};

mod error;
mod payload;

struct AppState {
    docker: Docker,
}

#[tauri::command]
async fn list_containers(state: State<'_, AppState>) -> Result<Vec<Container>, CommandError> {
    let docker = &state.docker;

    let containers = docker
        .list_containers(Some(ListContainersOptions::<String> {
            all: true,
            ..Default::default()
        }))
        .await
        .map_err(|e| CommandError::DockerError(e.to_string()))?;

    Ok(containers
        .into_iter()
        .map(|item| Container {
            name: item
                .names
                .as_ref()
                .and_then(|names| names.first())
                .map(|name| name.strip_prefix("/").unwrap_or(name).to_owned()),
            status: item.status,
            state: item.state,
            ports: item
                .ports
                .map(|port_list| port_list.into_iter().filter_map(|port| port.ip).collect()),
        })
        .collect())
}

#[tauri::command]
async fn list_imgs(state: State<'_, AppState>) -> Result<Vec<Image>, CommandError> {
    let docker = &state.docker;
    let images = docker
        .list_images(Some(ListImagesOptions::<String> {
            all: true,
            ..Default::default()
        }))
        .await
        .map_err(|e| CommandError::DockerError(e.to_string()))?;

    Ok(images
        .into_iter()
        .map(|item| Image {
            repo_tag: item.repo_tags.first().unwrap_or(&String::new()).to_owned(),
            size: item.size,
        })
        .collect())
}

#[tauri::command]
async fn emit_logs(
    state: State<'_, AppState>,
    name: &str,
    on_event: Channel<String>,
) -> Result<(), CommandError> {
    let docker = &state.docker;
    let options = Some(LogsOptions::<String> {
        stdout: true,
        stderr: true,
        tail: "all".parse().unwrap(),
        ..Default::default()
    });

    let mut logs_stream = docker.logs(name, options);

    while let Some(log_result) = logs_stream.next().await {
        match log_result {
            Ok(log) => {
                on_event.send(log.to_string()).map_err(|e| {
                    CommandError::UnexpectedError(format!("Error while emiting log: {}", e))
                })?;
            }
            Err(e) => {
                return Err(CommandError::DockerError(format!(
                    "Error while fetching logs: {}",
                    e
                )));
            }
        }
    }
    Ok(())
}

#[tauri::command]
async fn create_container(state: State<'_, AppState>, image: String) -> Result<(), CommandError> {
    let docker = &state.docker;
    let config = Config {
        image: Some(image),
        ..Default::default()
    };

    let res = docker
        .create_container(None::<CreateContainerOptions<String>>, config)
        .await
        .map_err(|e| CommandError::DockerError(format!("Error creating container: {}", e)))?;

    docker
        .start_container::<String>(&res.id, None)
        .await
        .map_err(|e| CommandError::DockerError(format!("Error starting container: {}", e)))?;

    println!("Container started");

    Ok(())
}

#[tauri::command]
async fn remove_img(state: State<'_, AppState>, img: &str) -> Result<(), CommandError> {
    let docker = &state.docker;

    let options = RemoveImageOptions {
        force: true,
        ..Default::default()
    };

    docker
        .remove_image(img, Some(options), None)
        .await
        .map_err(|e| {
            CommandError::DockerError(format!("Error removing image: {}, with error: {}", img, e))
        })?;

    Ok(())
}

#[tauri::command]
async fn stop_container(state: State<'_, AppState>, name: &str) -> Result<(), CommandError> {
    let docker = &state.docker;
    let options = StopContainerOptions { t: 10 };
    docker
        .stop_container(name, Some(options))
        .await
        .map_err(|e| {
            CommandError::DockerError(format!("Error stopping container: {}, {}", name, e))
        })?;
    Ok(())
}

#[tauri::command]
async fn kill_container(state: State<'_, AppState>, name: &str) -> Result<(), CommandError> {
    let docker = &state.docker;

    let options = KillContainerOptions { signal: "SIGKILL" };
    docker
        .kill_container(name, Some(options))
        .await
        .map_err(|e| {
            CommandError::DockerError(format!("Error killing container: {}, {}", name, e))
        })?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            docker: Docker::connect_with_local_defaults().unwrap(),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_containers,
            list_imgs,
            emit_logs,
            create_container,
            remove_img,
            stop_container,
            kill_container
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
