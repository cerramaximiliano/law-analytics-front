					{/* Primera fila: buscador a la izquierda, botones a la derecha */}
					<Stack
						direction={matchDownSM ? "column" : "row"}
						spacing={2}
						justifyContent="space-between"
						alignItems={matchDownSM ? "flex-start" : "center"}
						sx={{ p: 3, pb: 1 }}
					>
						{/* Buscador (izquierda) */}
						<Box maxWidth="300px" width={matchDownSM ? "100%" : "300px"}>
							<CustomGlobalFilter 
								preGlobalFilteredRows={preGlobalFilteredRows} 
								globalFilter={globalFilter} 
								setGlobalFilter={setGlobalFilter} 
							/>
						</Box>
						
						{/* Botones de acción (derecha) */}
						<Stack 
							direction="row" 
							spacing={1} 
							flexWrap="wrap"
							justifyContent="flex-end"
						>
							<Button
								color="secondary"
								size="small"
								variant="outlined"
								startIcon={<Archive />}
								onClick={() => onOpenArchivedModal()}
							>
								Archivados
							</Button>
							<Tooltip title={selectedCalculatorIds.length === 0 ? "Seleccione elementos para archivar" : ""}>
								<span>
									<Button
										color="primary"
										size="small"
										variant="outlined"
										startIcon={<Archive />}
										onClick={() => onArchiveCalculators(selectedCalculatorIds)}
										disabled={selectedCalculatorIds.length === 0 || processingAction}
									>
										Archivar {selectedCalculatorIds.length > 0 ? `(${selectedCalculatorIds.length})` : ""}
									</Button>
								</span>
							</Tooltip>
							<Button 
								color="primary" 
								size="small" 
								variant="contained" 
								startIcon={<Add />} 
								onClick={scrollToCalculators}
							>
								Nuevo cálculo
							</Button>
						</Stack>
					</Stack>
					
					{/* Segunda fila: selector de ordenamiento a la izquierda, botones de eliminar/exportar a la derecha */}
					<Stack
						direction={matchDownSM ? "column" : "row"}
						spacing={2}
						justifyContent="space-between"
						alignItems={matchDownSM ? "flex-start" : "center"}
						sx={{ px: 3, pb: 2 }}
					>
						{/* Selector de ordenamiento (izquierda) */}
						<Box maxWidth="250px" width={matchDownSM ? "100%" : "250px"}>
							<CustomSortingSelect sortBy={sortBy.id} setSortBy={setSortBy} allColumns={allColumns} />
						</Box>
						
						{/* Botones de eliminar y exportar (derecha) */}
						<Stack 
							direction="row" 
							spacing={1} 
							alignItems="center"
							justifyContent="flex-end"
						>
							{/* Botón de eliminar */}
							<Tooltip title={Object.keys(selectedRowIds).length === 0 ? "Seleccione elementos para eliminar" : `Eliminar ${Object.keys(selectedRowIds).length} elementos`}>
								<span>
									<IconButton
										color="error"
										onClick={handleDeleteSelected}
										disabled={Object.keys(selectedRowIds).length === 0 || processingAction}
										size="medium"
										sx={{
											position: 'relative',
											"&.Mui-disabled": {
												color: "text.disabled",
											},
										}}
									>
										<Trash variant="Bulk" size={22} />
										{Object.keys(selectedRowIds).length > 0 && (
											<Box
												sx={{
													position: 'absolute',
													top: -8,
													right: -8,
													bgcolor: 'error.main',
													color: 'white',
													borderRadius: '50%',
													fontSize: '0.75rem',
													minWidth: '20px',
													height: '20px',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontWeight: 'bold',
												}}
											>
												{Object.keys(selectedRowIds).length}
											</Box>
										)}
									</IconButton>
								</span>
							</Tooltip>
							
							{/* Botón de exportar CSV personalizado */}
							<Tooltip title="Exportar a CSV">
								<IconButton
									color="primary"
									size="medium"
									sx={{
										position: 'relative',
									}}
								>
									<CSVLink 
										data={data} 
										filename={"calculos-guardados.csv"}
										style={{ 
											color: 'inherit', 
											display: 'flex', 
											alignItems: 'center',
											textDecoration: 'none'
										}}
									>
										<DocumentDownload variant="Bulk" size={22} />
									</CSVLink>
								</IconButton>
							</Tooltip>
						</Stack>
					</Stack>